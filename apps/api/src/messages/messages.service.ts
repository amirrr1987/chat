import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan } from 'typeorm';
import {
  MessageDto,
  MessageStatus,
  sendMessageSchema,
  editMessageSchema,
  markReadSchema,
} from '@arazchat/shared';
import { Message } from '../entities/message.entity';
import { ChatRead } from '../entities/chat-read.entity';
import { User } from '../entities/user.entity';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messages: Repository<Message>,
    @InjectRepository(ChatRead) private reads: Repository<ChatRead>,
    @InjectRepository(User) private users: Repository<User>,
    private chats: ChatsService,
  ) {}

  async list(chatId: string, userId: string, limit = 50, before?: string) {
    await this.chats.assertMember(chatId, userId);

    const qb = this.messages
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replySender')
      .where('m.chatId = :chatId', { chatId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (before) {
      qb.andWhere('m.createdAt < (SELECT createdAt FROM messages WHERE id = :before)', {
        before,
      });
    }

    const rows = await qb.getMany();
    const statuses = await this.resolveStatuses(chatId, rows, userId);
    return rows.reverse().map((m) => this.toDto(m, statuses.get(m.id) ?? 'sent'));
  }

  async send(userId: string, body: unknown): Promise<MessageDto> {
    const input = sendMessageSchema.parse(body);
    await this.chats.assertMember(input.chatId, userId);

    const chatEntity = await this.chats.getChatEntity(input.chatId);
    const sender = await this.users.findOne({ where: { id: userId } });

    let type = input.type ?? 'text';
    let content = input.content ?? '';
    let replyToMessageId: string | null = null;
    let forwardFromMessageId: string | null = null;
    let forwardFromSenderId: string | null = null;
    let forwardFromSenderName: string | null = null;

    // Snapshot at send time: user settings ∩ chat settings ∩ optional per-message restrict
    // Later changes do not rewrite older messages (time-window / era frozen here).
    let allowForward =
      (sender?.allowForward !== false) &&
      (chatEntity.allowForward !== false) &&
      !input.restrictForward;
    let allowScreenshot =
      (sender?.allowScreenshot !== false) &&
      (chatEntity.allowScreenshot !== false) &&
      !input.restrictScreenshot;

    if (input.forwardFromMessageId) {
      const original = await this.messages.findOne({
        where: { id: input.forwardFromMessageId },
        relations: ['sender'],
      });
      if (!original || original.deletedAt) {
        throw new BadRequestException('Original message not found');
      }
      await this.chats.assertMember(original.chatId, userId);

      // Only the frozen message snapshot decides (بازه زمانی)
      if (original.allowForward === false) {
        throw new ForbiddenException('This message cannot be forwarded');
      }

      type = original.type;
      content = original.content;
      forwardFromMessageId = original.id;
      forwardFromSenderId = original.senderId;
      forwardFromSenderName = original.sender.displayName;
      // Copy: original era ∩ forwarder's settings ∩ destination chat
      allowForward =
        original.allowForward &&
        (sender?.allowForward !== false) &&
        (chatEntity.allowForward !== false) &&
        !input.restrictForward;
      allowScreenshot =
        original.allowScreenshot &&
        (sender?.allowScreenshot !== false) &&
        (chatEntity.allowScreenshot !== false) &&
        !input.restrictScreenshot;
    } else if (input.replyToMessageId) {
      const parent = await this.messages.findOne({
        where: { id: input.replyToMessageId, chatId: input.chatId },
      });
      if (!parent) throw new BadRequestException('Reply target not in this chat');
      replyToMessageId = parent.id;
    }

    const saved = await this.messages.save(
      this.messages.create({
        chatId: input.chatId,
        senderId: userId,
        type,
        content,
        replyToMessageId,
        forwardFromMessageId,
        forwardFromSenderId,
        forwardFromSenderName,
        allowForward,
        allowScreenshot,
        editedAt: null,
        deletedAt: null,
      }),
    );

    await this.chats.touchUpdatedAt(input.chatId);
    await this.upsertRead(input.chatId, userId, saved.id, saved.createdAt);

    const withSender = await this.messages.findOneOrFail({
      where: { id: saved.id },
      relations: ['sender', 'replyTo', 'replyTo.sender'],
    });

    return this.toDto(withSender, 'sent');
  }

  async edit(userId: string, messageId: string, body: unknown): Promise<MessageDto> {
    const input = editMessageSchema.parse(body);
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyTo', 'replyTo.sender'],
    });
    if (!message) throw new NotFoundException();
    if (message.senderId !== userId) throw new ForbiddenException();
    if (message.deletedAt) throw new BadRequestException('Message deleted');
    if (message.type !== 'text') throw new BadRequestException('Only text can be edited');

    message.content = input.content;
    message.editedAt = new Date();
    await this.messages.save(message);
    await this.chats.touchUpdatedAt(message.chatId);

    const status = (await this.resolveStatuses(message.chatId, [message], userId)).get(message.id) ?? 'sent';
    return this.toDto(message, status);
  }

  async softDelete(userId: string, messageId: string): Promise<MessageDto> {
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyTo', 'replyTo.sender'],
    });
    if (!message) throw new NotFoundException();
    if (message.senderId !== userId) throw new ForbiddenException();
    if (message.deletedAt) return this.toDto(message, 'sent');

    message.deletedAt = new Date();
    message.content = '';
    await this.messages.save(message);
    await this.chats.touchUpdatedAt(message.chatId);

    return this.toDto(message, 'sent');
  }

  async markRead(userId: string, body: unknown) {
    const input = markReadSchema.parse(body);
    await this.chats.assertMember(input.chatId, userId);

    let message = input.messageId
      ? await this.messages.findOne({ where: { id: input.messageId, chatId: input.chatId } })
      : await this.messages.findOne({
          where: { chatId: input.chatId },
          order: { createdAt: 'DESC' },
        });

    if (!message) return { ok: true, messageIds: [] as string[] };

    await this.upsertRead(input.chatId, userId, message.id, message.createdAt);

    const unreadFromOthers = await this.messages.find({
      where: {
        chatId: input.chatId,
        senderId: Not(userId),
        createdAt: LessThan(new Date(message.createdAt.getTime() + 1)),
        deletedAt: IsNull(),
      },
      select: ['id', 'senderId'],
    });

    return {
      ok: true,
      chatId: input.chatId,
      readerId: userId,
      messageIds: unreadFromOthers.map((m) => m.id),
      lastReadMessageId: message.id,
      lastReadAt: message.createdAt.toISOString(),
    };
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const read = await this.reads.findOne({ where: { chatId, userId } });
    const qb = this.messages
      .createQueryBuilder('m')
      .where('m.chatId = :chatId', { chatId })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.deletedAt IS NULL');

    if (read?.lastReadAt) {
      qb.andWhere('m.createdAt > :at', { at: read.lastReadAt });
    }

    return qb.getCount();
  }

  private async upsertRead(
    chatId: string,
    userId: string,
    messageId: string,
    at: Date,
  ) {
    await this.reads.upsert(
      {
        chatId,
        userId,
        lastReadMessageId: messageId,
        lastReadAt: at,
      },
      {
        conflictPaths: ['chatId', 'userId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }

  private async resolveStatuses(
    chatId: string,
    messages: Message[],
    viewerId: string,
  ): Promise<Map<string, MessageStatus>> {
    const map = new Map<string, MessageStatus>();
    if (messages.length === 0) return map;

    const memberIds = await this.chats.getMemberIds(chatId);
    const others = memberIds.filter((id) => id !== viewerId);
    const reads = await this.reads.find({ where: { chatId } });

    for (const msg of messages) {
      if (msg.senderId !== viewerId) {
        map.set(msg.id, 'sent');
        continue;
      }
      if (others.length === 0) {
        // Saved Messages — always read
        map.set(msg.id, 'read');
        continue;
      }
      const otherReads = reads.filter((r) => others.includes(r.userId));
      if (otherReads.length === 0) {
        map.set(msg.id, 'sent');
        continue;
      }
      const allRead = otherReads.every(
        (r) => r.lastReadAt && r.lastReadAt >= msg.createdAt,
      );
      const anyRead = otherReads.some(
        (r) => r.lastReadAt && r.lastReadAt >= msg.createdAt,
      );
      if (allRead && otherReads.length === others.length) {
        map.set(msg.id, 'read');
      } else if (anyRead) {
        map.set(msg.id, others.length === 1 ? 'read' : 'delivered');
      } else {
        map.set(msg.id, 'delivered');
      }
    }
    return map;
  }

  toDto(message: Message, status: MessageStatus = 'sent'): MessageDto {
    const deleted = !!message.deletedAt;
    const reply = message.replyTo;
    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        displayName: message.sender.displayName,
        avatarUrl: message.sender.avatarUrl ?? null,
      },
      type: message.type,
      content: deleted ? '' : message.content,
      status,
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
      replyTo: reply
        ? {
            id: reply.id,
            senderId: reply.senderId,
            senderName: reply.sender?.displayName ?? '',
            type: reply.type,
            content: reply.deletedAt ? '' : reply.content.slice(0, 120),
            deleted: !!reply.deletedAt,
          }
        : null,
      forwardFrom: message.forwardFromMessageId
        ? {
            messageId: message.forwardFromMessageId,
            senderId: message.forwardFromSenderId ?? message.senderId,
            senderName: message.forwardFromSenderName ?? message.sender.displayName,
          }
        : null,
      allowForward: message.allowForward ?? true,
      allowScreenshot: message.allowScreenshot ?? true,
    };
  }
}
