export type ChatType = 'direct' | 'group' | 'saved';
export type MessageType = 'text' | 'image';
export type Locale = 'fa' | 'en';
export type LastSeenVisibility = 'everyone' | 'nobody';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface UserDto {
  id: string;
  mobile: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  locale: Locale;
  lastSeenVisibility: LastSeenVisibility;
  allowForward: boolean;
  allowScreenshot: boolean;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
  current: boolean;
}

/** Preview of replied-to message (reference) */
export interface MessageReplyRef {
  id: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  deleted: boolean;
}

/** Forward attribution — reference ids + display snapshot */
export interface MessageForwardRef {
  messageId: string;
  senderId: string;
  senderName: string;
}

export interface ChatDto {
  id: string;
  type: ChatType;
  name: string | null;
  participants: UserDto[];
  lastMessage: MessageDto | null;
  unreadCount: number;
  updatedAt: string;
  isSavedMessages: boolean;
  /** Effective for viewer: chat flags ∩ peer settings (direct) */
  allowForward: boolean;
  allowScreenshot: boolean;
  /** Raw chat-level flags (for editing this chat's privacy) */
  chatAllowForward: boolean;
  chatAllowScreenshot: boolean;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  sender: Pick<UserDto, 'id' | 'displayName' | 'avatarUrl'>;
  type: MessageType;
  content: string;
  status: MessageStatus;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  replyTo: MessageReplyRef | null;
  forwardFrom: MessageForwardRef | null;
  /** Frozen at send time from user + chat settings (+ optional restrict) */
  allowForward: boolean;
  allowScreenshot: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';

export interface CallInvitePayload {
  callId: string;
  chatId: string;
  fromUserId: string;
  fromDisplayName: string;
}

export interface CallActionPayload {
  callId: string;
  fromUserId: string;
}

export interface CallSignalPayload {
  callId: string;
  fromUserId: string;
  signal: unknown;
}
