export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisKeys = {
  userOnline: (userId: string) => `user:${userId}:online`,
  userLastSeen: (userId: string) => `user:${userId}:lastSeen`,
  chatRoom: (chatId: string) => `chat:${chatId}:room`,
  userChats: (userId: string) => `user:${userId}:chats`,
} as const;

export const RedisTTL = {
  online: 60 * 5,
  userChats: 60 * 10,
  lastSeen: 60 * 60 * 24 * 90,
} as const;
