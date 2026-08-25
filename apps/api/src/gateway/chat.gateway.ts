import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import {
  WS_EVENTS,
  sendMessageSchema,
  markReadSchema,
  editMessageSchema,
  callInviteSchema,
  callActionSchema,
  callSignalSchema,
} from '@arazchat/shared';
import { REDIS_CLIENT, RedisKeys, RedisTTL } from '../redis/redis.constants';
import { MessagesService } from '../messages/messages.service';
import { ChatsService } from '../chats/chats.service';

type ActiveCall = {
  callId: string;
  chatId: string;
  callerId: string;
  calleeId: string;
};

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private calls = new Map<string, ActiveCall>();
  private userInCall = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private messages: MessagesService,
    private chats: ChatsService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

      const payload = this.jwt.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      await this.redis.set(
        RedisKeys.userOnline(payload.sub),
        client.id,
        'EX',
        RedisTTL.online,
      );

      this.server.emit(WS_EVENTS.USER_ONLINE, { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const lastSeen = new Date().toISOString();
    await this.redis.del(RedisKeys.userOnline(userId));
    await this.redis.set(RedisKeys.userLastSeen(userId), lastSeen, 'EX', RedisTTL.lastSeen);
    this.server.emit(WS_EVENTS.USER_OFFLINE, { userId, lastSeenAt: lastSeen });

    const callId = this.userInCall.get(userId);
    if (callId) this.endCallInternal(callId, userId);
  }

  @SubscribeMessage(WS_EVENTS.JOIN_CHAT)
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId as string;
    await this.chats.assertMember(data.chatId, userId);
    client.join(data.chatId);

    const readResult = await this.messages.markRead(userId, { chatId: data.chatId });
    await this.emitRead(readResult);

    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.LEAVE_CHAT)
  leaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(data.chatId);
    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.SEND_MESSAGE)
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = sendMessageSchema.parse(body);
    const message = await this.messages.send(userId, input);

    const memberIds = await this.chats.getMemberIds(input.chatId);
    for (const memberId of memberIds) {
      const online = memberId !== userId && !!(await this.redis.get(RedisKeys.userOnline(memberId)));
      const payload =
        memberId === userId
          ? message
          : { ...message, status: online ? ('delivered' as const) : ('sent' as const) };
      this.server.to(`user:${memberId}`).emit(WS_EVENTS.NEW_MESSAGE, payload);
    }

    const peersOnline = await Promise.all(
      memberIds
        .filter((id) => id !== userId)
        .map(async (id) => !!(await this.redis.get(RedisKeys.userOnline(id)))),
    );
    if (peersOnline.some(Boolean)) {
      this.server.to(`user:${userId}`).emit(WS_EVENTS.MESSAGE_STATUS, {
        messageIds: [message.id],
        status: 'delivered',
        chatId: message.chatId,
      });
    }

    return message;
  }

  @SubscribeMessage(WS_EVENTS.MARK_READ)
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    markReadSchema.parse(body);
    const result = await this.messages.markRead(userId, body);
    await this.emitRead(result);
    return result;
  }

  @SubscribeMessage(WS_EVENTS.MESSAGE_EDIT)
  async editMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string; content: string },
  ) {
    const userId = client.data.userId as string;
    editMessageSchema.parse({ content: body.content });
    const message = await this.messages.edit(userId, body.messageId, {
      content: body.content,
    });
    await this.broadcastToMembers(message.chatId, WS_EVENTS.MESSAGE_UPDATED, message);
    return message;
  }

  @SubscribeMessage(WS_EVENTS.MESSAGE_DELETE)
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    const userId = client.data.userId as string;
    const message = await this.messages.softDelete(userId, body.messageId);
    await this.broadcastToMembers(message.chatId, WS_EVENTS.MESSAGE_DELETED, message);
    return message;
  }

  @SubscribeMessage(WS_EVENTS.TYPING)
  typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    client.to(data.chatId).emit(WS_EVENTS.TYPING, {
      chatId: data.chatId,
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage(WS_EVENTS.CALL_INVITE)
  async callInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = callInviteSchema.parse(body);
    await this.chats.assertMember(input.chatId, userId);

    const peerId = await this.chats.getDirectPeerId(input.chatId, userId);
    if (!peerId) {
      return { ok: false, error: 'Voice calls are only for direct chats' };
    }

    if (this.userInCall.has(userId) || this.userInCall.has(peerId)) {
      client.emit(WS_EVENTS.CALL_BUSY, { callId: input.callId, fromUserId: peerId });
      return { ok: false, error: 'busy' };
    }

    const chat = await this.chats.getChatDto(input.chatId, userId);
    const me = chat.participants.find((p) => p.id === userId);

    this.calls.set(input.callId, {
      callId: input.callId,
      chatId: input.chatId,
      callerId: userId,
      calleeId: peerId,
    });
    this.userInCall.set(userId, input.callId);
    this.userInCall.set(peerId, input.callId);

    this.server.to(`user:${peerId}`).emit(WS_EVENTS.CALL_INVITE, {
      callId: input.callId,
      chatId: input.chatId,
      fromUserId: userId,
      fromDisplayName: me?.displayName ?? 'User',
    });

    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.CALL_ACCEPT)
  callAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = callActionSchema.parse(body);
    const call = this.calls.get(input.callId);
    if (!call || call.calleeId !== userId) return { ok: false };

    this.server.to(`user:${call.callerId}`).emit(WS_EVENTS.CALL_ACCEPT, {
      callId: input.callId,
      fromUserId: userId,
    });
    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.CALL_REJECT)
  callReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = callActionSchema.parse(body);
    const call = this.calls.get(input.callId);
    if (!call || (call.calleeId !== userId && call.callerId !== userId)) {
      return { ok: false };
    }

    const peerId = call.callerId === userId ? call.calleeId : call.callerId;
    this.clearCall(input.callId);
    this.server.to(`user:${peerId}`).emit(WS_EVENTS.CALL_REJECT, {
      callId: input.callId,
      fromUserId: userId,
    });
    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.CALL_END)
  callEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = callActionSchema.parse(body);
    this.endCallInternal(input.callId, userId);
    return { ok: true };
  }

  @SubscribeMessage(WS_EVENTS.CALL_SIGNAL)
  callSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.userId as string;
    const input = callSignalSchema.parse(body);
    const call = this.calls.get(input.callId);
    if (!call || (call.callerId !== userId && call.calleeId !== userId)) {
      return { ok: false };
    }

    const peerId = call.callerId === userId ? call.calleeId : call.callerId;
    this.server.to(`user:${peerId}`).emit(WS_EVENTS.CALL_SIGNAL, {
      callId: input.callId,
      fromUserId: userId,
      signal: input.signal,
    });
    return { ok: true };
  }

  private endCallInternal(callId: string, fromUserId: string) {
    const call = this.calls.get(callId);
    if (!call) return;
    const peerId = call.callerId === fromUserId ? call.calleeId : call.callerId;
    this.clearCall(callId);
    this.server.to(`user:${peerId}`).emit(WS_EVENTS.CALL_END, {
      callId,
      fromUserId,
    });
  }

  private clearCall(callId: string) {
    const call = this.calls.get(callId);
    if (!call) return;
    this.calls.delete(callId);
    this.userInCall.delete(call.callerId);
    this.userInCall.delete(call.calleeId);
  }

  private async emitRead(result: {
    ok: boolean;
    chatId?: string;
    readerId?: string;
    messageIds?: string[];
  }) {
    if (!result.chatId || !result.messageIds?.length) return;
    const memberIds = await this.chats.getMemberIds(result.chatId);
    for (const memberId of memberIds) {
      this.server.to(`user:${memberId}`).emit(WS_EVENTS.MESSAGE_STATUS, {
        chatId: result.chatId,
        readerId: result.readerId,
        messageIds: result.messageIds,
        status: 'read',
      });
    }
  }

  private async broadcastToMembers(chatId: string, event: string, payload: unknown) {
    const memberIds = await this.chats.getMemberIds(chatId);
    for (const memberId of memberIds) {
      this.server.to(`user:${memberId}`).emit(event, payload);
    }
  }
}
