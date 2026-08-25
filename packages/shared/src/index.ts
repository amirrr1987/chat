export * from './schemas';
export type * from './types';

/** Defined here (not re-exported) so CJS/ESM interop works with Vite/Rollup. */
export const WS_EVENTS = {
  JOIN_CHAT: 'chat:join',
  LEAVE_CHAT: 'chat:leave',
  SEND_MESSAGE: 'message:send',
  NEW_MESSAGE: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_STATUS: 'message:status',
  MARK_READ: 'message:read',
  TYPING: 'chat:typing',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  /** 1:1 voice call signaling */
  CALL_INVITE: 'call:invite',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  CALL_SIGNAL: 'call:signal',
  CALL_BUSY: 'call:busy',
} as const;
