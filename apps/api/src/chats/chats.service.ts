import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatDto, MessageDto, createDirectChatSchema, createGroupChatSchema, updateChatPrivacySchema } from '@arazchat/shared';
import { Chat } from '../entities/chat.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { Message } from '../entities/message.entity';
import { ChatRead } from '../entities/chat-read.entity';
import { toUserDto } from '../common/mappers';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private chats: Repository<Chat>,
    @InjectRepository(ChatParticipant) private participants: Repository<ChatParticipant>,
    @InjectRepository(Message) private messages: Repository<Message>,
    @InjectRepository(ChatRead) private reads: Repository<ChatRead>,
  ) {}

  async getChatEntity(chatId: string): Promise<Chat> {
    const chat = await this.chats.findOne({ where: { id: chatId } });
    if (!chat) throw new ForbiddenException('Chat not found');
    return chat;
  }

  async updatePrivacy(chatId: string, userId: string, body: unknown): Promise<ChatDto> {
    const input = updateChatPrivacySchema.parse(body);
    await this.assertMember(chatId, userId);
    const chat = await this.getChatEntity(chatId);
    if (chat.type === 'saved') {
      return this.getChatDto(chatId, userId);
    }
    if (input.allowForward !== undefined) chat.allowForward = input.allowForward;
    if (input.allowScreenshot !== undefined) chat.allowScreenshot = input.allowScreenshot;
    await this.chats.save(chat);
    return this.getChatDto(chatId, userId);
  }

  async listForUser(userId: string): Promise<ChatDto[]> {
    const rows = await this.participants.find({
      where: { userId },
      relations: ['chat', 'chat.participants', 'chat.participants.user'],
    });

    const chatIds = rows.map((r) => r.chatId);
    const lastMessages = await this.getLastMessages(chatIds);
    const unreadMap = await this.getUnreadCounts(chatIds, userId);

    return rows
      .map((row) =>
        this.toChatDto(
          row.chat,
          lastMessages.get(row.chatId) ?? null,
          unreadMap.get(row.chatId) ?? 0,
          userId,
        ),
      )
      .sort((a, b) => {
        if (a.isSavedMessages !== b.isSavedMessages) return a.isSavedMessages ? -1 : 1;
        const aTime = a.lastMessage?.createdAt ?? a.updatedAt;
        const bTime = b.lastMessage?.createdAt ?? b.updatedAt;
        return bTime.localeCompare(aTime);
      });
  }

  async touchUpdatedAt(chatId: string) {
    await this.chats.update(chatId, { updatedAt: new Date() });
  }

  async createDirect(userId: string, body: unknown): Promise<ChatDto> {
    const input = createDirectChatSchema.parse(body);

    // Telegram-style Saved Messages when chatting with yourself
    if (input.participantId === userId) {
      return this.getOrCreateSavedMessages(userId);
    }

    const existing = await this.findDirectChat(userId, input.participantId);
    if (existing) {
      return this.getChatDto(existing, userId);
    }

    const chat = await this.chats.save(
      this.chats.create({ type: 'direct', name: null }),
    );

    await this.participants.save([
      this.participants.create({ chatId: chat.id, userId }),
      this.participants.create({ chatId: chat.id, userId: input.participantId }),
    ]);

    return this.getChatDto(chat.id, userId);
  }

  async getOrCreateSavedMessages(userId: string): Promise<ChatDto> {
    const existing = await this.findSavedChat(userId);
    if (existing) return this.getChatDto(existing, userId);

    const chat = await this.chats.save(
      this.chats.create({ type: 'saved', name: null }),
    );
    await this.participants.save(
      this.participants.create({ chatId: chat.id, userId }),
    );
    return this.getChatDto(chat.id, userId);
  }

  async createGroup(userId: string, body: unknown): Promise<ChatDto> {
    const input = createGroupChatSchema.parse(body);
    const uniqueIds = [...new Set([userId, ...input.participantIds])];

    const chat = await this.chats.save(
      this.chats.create({ type: 'group', name: input.name }),
    );

    await this.participants.save(
      uniqueIds.map((id) =>
        this.participants.create({ chatId: chat.id, userId: id }),
      ),
    );

    return this.getChatDto(chat.id, userId);
  }

  async getChatDto(chatId: string, userId: string): Promise<ChatDto> {
    await this.assertMember(chatId, userId);
    const chat = await this.chats.findOneOrFail({
      where: { id: chatId },
      relations: ['participants', 'participants.user'],
    });
    const last = await this.messages.findOne({
      where: { chatId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });
    const unread = (await this.getUnreadCounts([chatId], userId)).get(chatId) ?? 0;
    return this.toChatDto(chat, last, unread, userId);
  }

  async assertMember(chatId: string, userId: string) {
    const member = await this.participants.findOne({ where: { chatId, userId } });
    if (!member) {
      throw new ForbiddenException('Not a member of this chat');
    }
  }

  async getMemberIds(chatId: string): Promise<string[]> {
    const rows = await this.participants.find({ where: { chatId } });
    return rows.map((r) => r.userId);
  }

  /** Peer user id for a direct chat (not self). Null for group/saved. */
  async getDirectPeerId(chatId: string, userId: string): Promise<string | null> {
    const chat = await this.getChatEntity(chatId);
    if (chat.type !== 'direct') return null;
    const ids = await this.getMemberIds(chatId);
    return ids.find((id) => id !== userId) ?? null;
  }

  private async findSavedChat(userId: string) {
    const row = await this.chats
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p', 'p.userId = :userId', { userId })
      .where('c.type = :type', { type: 'saved' })
      .select('c.id', 'id')
      .getRawOne<{ id: string }>();
    return row?.id ?? null;
  }

  private async findDirectChat(userA: string, userB: string) {
    const row = await this.chats
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p1', 'p1.userId = :userA', { userA })
      .innerJoin('c.participants', 'p2', 'p2.userId = :userB', { userB })
      .where('c.type = :type', { type: 'direct' })
      .select('c.id', 'id')
      .getRawOne<{ id: string }>();

    return row?.id ?? null;
  }

  private async getLastMessages(chatIds: string[]) {
    const map = new Map<string, Message>();
    if (chatIds.length === 0) return map;

    const messages = await this.messages.find({
      where: { chatId: In(chatIds) },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    for (const msg of messages) {
      if (!map.has(msg.chatId)) {
        map.set(msg.chatId, msg);
      }
    }
    return map;
  }

  private async getUnreadCounts(chatIds: string[], userId: string) {
    const map = new Map<string, number>();
    if (chatIds.length === 0) return map;

    const reads = await this.reads.find({
      where: { userId, chatId: In(chatIds) },
    });
    const readByChat = new Map(reads.map((r) => [r.chatId, r]));

    for (const chatId of chatIds) {
      const read = readByChat.get(chatId);
      const qb = this.messages
        .createQueryBuilder('m')
        .where('m.chatId = :chatId', { chatId })
        .andWhere('m.senderId != :userId', { userId })
        .andWhere('m.deletedAt IS NULL');
      if (read?.lastReadAt) {
        qb.andWhere('m.createdAt > :at', { at: read.lastReadAt });
      }
      map.set(chatId, await qb.getCount());
    }
    return map;
  }

  private toMessageDto(lastMessage: Message): MessageDto {
    const deleted = !!lastMessage.deletedAt;
    return {
      id: lastMessage.id,
      chatId: lastMessage.chatId,
      senderId: lastMessage.senderId,
      sender: {
        id: lastMessage.sender.id,
        displayName: lastMessage.sender.displayName,
        avatarUrl: lastMessage.sender.avatarUrl ?? null,
      },
      type: lastMessage.type,
      content: deleted ? '' : lastMessage.content,
      status: 'sent',
      editedAt: lastMessage.editedAt?.toISOString() ?? null,
      deletedAt: lastMessage.deletedAt?.toISOString() ?? null,
      createdAt: lastMessage.createdAt.toISOString(),
      replyTo: null,
      forwardFrom: lastMessage.forwardFromMessageId
        ? {
            messageId: lastMessage.forwardFromMessageId,
            senderId: lastMessage.forwardFromSenderId ?? lastMessage.senderId,
            senderName: lastMessage.forwardFromSenderName ?? lastMessage.sender.displayName,
          }
        : null,
      allowForward: lastMessage.allowForward ?? true,
      allowScreenshot: lastMessage.allowScreenshot ?? true,
    };
  }

  private toChatDto(
    chat: Chat,
    lastMessage: Message | null,
    unreadCount = 0,
    viewerId?: string,
  ): ChatDto {
    const isSavedMessages = chat.type === 'saved';
    const participants = (chat.participants ?? []).map((p) => toUserDto(p.user));

    // Effective privacy for THIS chat room (viewer perspective):
    // chat flags ∩ peer user settings (direct) — group uses chat flags
    let allowForward = chat.allowForward ?? true;
    let allowScreenshot = chat.allowScreenshot ?? true;

    if (isSavedMessages) {
      allowForward = true;
      allowScreenshot = true;
    } else if (chat.type === 'direct' && viewerId) {
      const peer = participants.find((p) => p.id !== viewerId);
      if (peer) {
        allowForward = allowForward && peer.allowForward;
        allowScreenshot = allowScreenshot && peer.allowScreenshot;
      }
    }

    return {
      id: chat.id,
      type: chat.type,
      name: chat.name,
      participants,
      lastMessage: lastMessage ? this.toMessageDto(lastMessage) : null,
      unreadCount,
      updatedAt: chat.updatedAt.toISOString(),
      isSavedMessages,
      allowForward,
      allowScreenshot,
      chatAllowForward: chat.allowForward ?? true,
      chatAllowScreenshot: chat.allowScreenshot ?? true,
    };
  }
}
