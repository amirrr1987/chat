import { onMounted, onUnmounted } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import {
  WS_EVENTS,
  type ChatDto,
  type MessageDto,
  type MessageStatus,
} from '@arazchat/shared';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth';

function sortChats(chats: ChatDto[]) {
  return [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.updatedAt;
    const bTime = b.lastMessage?.createdAt ?? b.updatedAt;
    return bTime.localeCompare(aTime);
  });
}

function applyIncomingMessage(
  qc: ReturnType<typeof useQueryClient>,
  msg: MessageDto,
  myId?: string,
) {
  qc.setQueryData<MessageDto[]>(['messages', msg.chatId], (old) => {
    if (!old) return old;
    if (old.some((m) => m.id === msg.id)) return old;
    return [...old, msg];
  });

  qc.setQueryData<ChatDto[]>(['chats'], (old) => {
    if (!old) return old;
    const next = old.map((chat) => {
      if (chat.id !== msg.chatId) return chat;
      const unreadBump =
        myId && msg.senderId !== myId ? (chat.unreadCount ?? 0) + 1 : chat.unreadCount ?? 0;
      return {
        ...chat,
        lastMessage: msg,
        updatedAt: msg.createdAt,
        unreadCount: unreadBump,
      };
    });
    return sortChats(next);
  });
}

export function useRealtimeMessages() {
  const qc = useQueryClient();
  const auth = useAuthStore();

  function onMessage(msg: MessageDto) {
    applyIncomingMessage(qc, msg, auth.user?.id);
  }

  function onUpdated(msg: MessageDto) {
    qc.setQueryData<MessageDto[]>(['messages', msg.chatId], (old) =>
      (old ?? []).map((m) => (m.id === msg.id ? msg : m)),
    );
    qc.setQueryData<ChatDto[]>(['chats'], (old) =>
      sortChats(
        (old ?? []).map((c) =>
          c.lastMessage?.id === msg.id ? { ...c, lastMessage: msg } : c,
        ),
      ),
    );
  }

  function onDeleted(msg: MessageDto) {
    onUpdated(msg);
  }

  function onStatus(payload: {
    messageIds: string[];
    status: MessageStatus;
    chatId: string;
  }) {
    const rank: Record<MessageStatus, number> = { sent: 0, delivered: 1, read: 2 };
    const nextRank = rank[payload.status] ?? 0;

    qc.setQueryData<MessageDto[]>(['messages', payload.chatId], (old) =>
      (old ?? []).map((m) => {
        if (!payload.messageIds.includes(m.id) || m.senderId !== auth.user?.id) return m;
        const cur = rank[m.status] ?? 0;
        if (nextRank < cur) return m;
        return { ...m, status: payload.status };
      }),
    );

    qc.setQueryData<ChatDto[]>(['chats'], (old) =>
      (old ?? []).map((c) => {
        if (c.id !== payload.chatId || !c.lastMessage) return c;
        if (!payload.messageIds.includes(c.lastMessage.id)) return c;
        if (c.lastMessage.senderId !== auth.user?.id) return c;
        const cur = rank[c.lastMessage.status] ?? 0;
        if (nextRank < cur) return c;
        return { ...c, lastMessage: { ...c.lastMessage, status: payload.status } };
      }),
    );
  }

  function onPresence(payload: { userId: string; lastSeenAt?: string }, online: boolean) {
    qc.setQueryData<ChatDto[]>(['chats'], (old) =>
      (old ?? []).map((chat) => ({
        ...chat,
        participants: chat.participants.map((p) =>
          p.id === payload.userId
            ? {
                ...p,
                isOnline: online,
                lastSeenAt: online ? null : (payload.lastSeenAt ?? p.lastSeenAt),
              }
            : p,
        ),
      })),
    );
  }

  onMounted(() => {
    const socket = connectSocket();
    socket.on(WS_EVENTS.NEW_MESSAGE, onMessage);
    socket.on(WS_EVENTS.MESSAGE_UPDATED, onUpdated);
    socket.on(WS_EVENTS.MESSAGE_DELETED, onDeleted);
    socket.on(WS_EVENTS.MESSAGE_STATUS, onStatus);
    socket.on(WS_EVENTS.USER_ONLINE, (p: { userId: string }) => onPresence(p, true));
    socket.on(WS_EVENTS.USER_OFFLINE, (p: { userId: string; lastSeenAt?: string }) =>
      onPresence(p, false),
    );
  });

  onUnmounted(() => {
    const socket = getSocket();
    socket.off(WS_EVENTS.NEW_MESSAGE, onMessage);
    socket.off(WS_EVENTS.MESSAGE_UPDATED, onUpdated);
    socket.off(WS_EVENTS.MESSAGE_DELETED, onDeleted);
    socket.off(WS_EVENTS.MESSAGE_STATUS, onStatus);
    socket.off(WS_EVENTS.USER_ONLINE);
    socket.off(WS_EVENTS.USER_OFFLINE);
  });
}
