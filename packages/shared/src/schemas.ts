import { z } from 'zod';

export const registerSchema = z.object({
  mobile: z
    .string()
    .regex(/^09\d{9}$/, 'Mobile must be a valid Iranian number (09xxxxxxxxx)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2).max(50).optional(),
  deviceId: z.string().min(8).max(128).optional(),
  deviceName: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  password: z.string().min(1),
  deviceId: z.string().min(8).max(128).optional(),
  deviceName: z.string().max(120).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
  deviceId: z.string().min(8).max(128).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(200).optional().nullable(),
  locale: z.enum(['fa', 'en']).optional(),
  lastSeenVisibility: z.enum(['everyone', 'nobody']).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
  allowForward: z.boolean().optional(),
  allowScreenshot: z.boolean().optional(),
});

export const createDirectChatSchema = z.object({
  participantId: z.string().uuid(),
});

export const createGroupChatSchema = z.object({
  name: z.string().min(2).max(100),
  participantIds: z.array(z.string().uuid()).min(1),
});

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  type: z.enum(['text', 'image']).default('text'),
  content: z.string().max(5000).optional(),
  replyToMessageId: z.string().uuid().optional(),
  /** Reference to original — server copies snapshot + keeps forwardFrom* ids */
  forwardFromMessageId: z.string().uuid().optional(),
  /** Extra restrict for this message only (on top of user/chat settings at send time) */
  restrictForward: z.boolean().optional(),
  restrictScreenshot: z.boolean().optional(),
}).superRefine((val, ctx) => {
  if (val.forwardFromMessageId) return;
  if (!val.content || val.content.length < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'content required', path: ['content'] });
  }
});

export const updateChatPrivacySchema = z.object({
  allowForward: z.boolean().optional(),
  allowScreenshot: z.boolean().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const markReadSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
});

export const callInviteSchema = z.object({
  callId: z.string().uuid(),
  chatId: z.string().uuid(),
});

export const callActionSchema = z.object({
  callId: z.string().uuid(),
});

export const callSignalSchema = z.object({
  callId: z.string().uuid(),
  signal: z.unknown(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateDirectChatInput = z.infer<typeof createDirectChatSchema>;
export type CreateGroupChatInput = z.infer<typeof createGroupChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type UpdateChatPrivacyInput = z.infer<typeof updateChatPrivacySchema>;
export type CallInviteInput = z.infer<typeof callInviteSchema>;
export type CallActionInput = z.infer<typeof callActionSchema>;
export type CallSignalInput = z.infer<typeof callSignalSchema>;
