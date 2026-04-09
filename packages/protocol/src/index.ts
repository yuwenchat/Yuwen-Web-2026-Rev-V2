import { z } from "zod";

export const idSchema = z.string().min(1).max(64);
export const timestampSchema = z.string().min(1);
export const emailSchema = z.string().trim().toLowerCase().email();
export const authCodeSchema = z.string().trim().regex(/^\d{6}$/);
export const handlePattern = /^[a-z0-9_]{4,24}$/;
export const friendCodePattern = /^[A-Z2-9]{6,12}$/;

export const authIntentPurposeSchema = z.enum(["register", "login"]);
export const authIntentChannelSchema = z.enum(["code", "magic_link"]);
export const conversationKindSchema = z.enum(["direct"]);
export const securityModeSchema = z.enum([
  "transport_protected",
  "e2ee_ready",
  "e2ee_verified"
]);
export const messagePayloadFormatSchema = z.enum(["plain_text"]);
export const messageEncryptionStateSchema = z.enum([
  "not_encrypted",
  "transport_encrypted",
  "end_to_end_ready",
  "end_to_end_verified"
]);
export const tombstoneTypeSchema = z.enum(["none", "deleted"]);

export type AuthIntentPurpose = z.infer<typeof authIntentPurposeSchema>;
export type AuthIntentChannel = z.infer<typeof authIntentChannelSchema>;
export type ConversationKind = z.infer<typeof conversationKindSchema>;
export type SecurityMode = z.infer<typeof securityModeSchema>;
export type MessagePayloadFormat = z.infer<typeof messagePayloadFormatSchema>;
export type MessageEncryptionState = z.infer<
  typeof messageEncryptionStateSchema
>;
export type TombstoneType = z.infer<typeof tombstoneTypeSchema>;

export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function isFriendCode(value: string): boolean {
  return friendCodePattern.test(value.trim().toUpperCase());
}

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(48),
  bio: z.string().trim().max(160).default("")
});

export const publicUserSchema = z.object({
  id: idSchema,
  primaryEmail: emailSchema,
  emailVerifiedAt: timestampSchema.nullable(),
  friendCode: z.string().regex(friendCodePattern),
  handle: z.string().regex(handlePattern),
  profile: profileSchema
});

export const passwordCredentialSchema = z.object({
  userId: idSchema,
  passwordHash: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const authIntentSchema = z.object({
  id: idSchema,
  email: emailSchema,
  purpose: authIntentPurposeSchema,
  channel: authIntentChannelSchema,
  codeHash: z.string().nullable(),
  magicTokenHash: z.string().nullable(),
  expiresAt: timestampSchema,
  consumedAt: timestampSchema.nullable(),
  ipHash: z.string().nullable(),
  uaHash: z.string().nullable()
});

export const friendCodeRotationSchema = z.object({
  userId: idSchema,
  oldCode: z.string().regex(friendCodePattern),
  newCode: z.string().regex(friendCodePattern),
  rotatedAt: timestampSchema,
  ipHash: z.string().nullable()
});

export const deviceSchema = z.object({
  id: idSchema,
  userId: idSchema,
  platform: z.enum(["web", "ios", "android"]),
  name: z.string().min(1).max(64),
  lastSeenAt: timestampSchema,
  trustState: z.enum(["trusted", "pending"])
});

export const conversationSchema = z.object({
  id: idSchema,
  kind: conversationKindSchema,
  securityMode: securityModeSchema,
  participantIds: z.array(idSchema).min(2).max(2),
  lastMessageId: idSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const messagePayloadSchema = z.object({
  text: z.string().trim().min(1).max(4000)
});

export const messageSchema = z.object({
  id: idSchema,
  conversationId: idSchema,
  senderUserId: idSchema,
  senderDeviceId: idSchema.nullable(),
  payload: messagePayloadSchema,
  payloadFormat: messagePayloadFormatSchema,
  encryptionState: messageEncryptionStateSchema,
  sentAt: timestampSchema,
  editedAt: timestampSchema.nullable(),
  deletedForEveryoneAt: timestampSchema.nullable(),
  tombstoneType: tombstoneTypeSchema
});

export const messageVisibilitySchema = z.object({
  messageId: idSchema,
  userId: idSchema,
  hiddenAt: timestampSchema
});

export const readStateSchema = z.object({
  conversationId: idSchema,
  userId: idSchema,
  lastReadMessageId: idSchema,
  readAt: timestampSchema
});

export const authSessionSchema = z.object({
  user: publicUserSchema,
  device: deviceSchema,
  accessToken: z.string().min(32),
  refreshToken: z.string().min(32)
});

export const requestCodeSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url().optional(),
  deviceName: z.string().trim().min(1).max(64).optional()
});

export const confirmCodeSchema = z.object({
  email: emailSchema,
  code: authCodeSchema,
  deviceName: z.string().trim().min(1).max(64).optional()
});

export const requestMagicLinkSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url().optional(),
  deviceName: z.string().trim().min(1).max(64).optional()
});

export const consumeMagicLinkSchema = z.object({
  email: emailSchema,
  token: z.string().trim().min(24),
  deviceName: z.string().trim().min(1).max(64).optional()
});

export const passwordLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  deviceName: z.string().trim().min(1).max(64).optional()
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().trim().min(32)
});

export const setPasswordSchema = z.object({
  password: z.string().min(8).max(128)
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(48).optional(),
  bio: z.string().trim().max(160).optional(),
  handle: z
    .string()
    .trim()
    .transform(normalizeHandle)
    .refine((value) => handlePattern.test(value), {
      message: "Handle must be 4-24 lowercase letters, numbers, or underscores."
    })
    .optional()
});

export const friendRequestCreateSchema = z.object({
  identifier: z.string().trim().min(4).max(32)
});

export const messageCreateSchema = z.object({
  clientMessageId: z.string().trim().min(1).max(80),
  payload: messagePayloadSchema,
  payloadFormat: messagePayloadFormatSchema.default("plain_text")
});

export const messageUpdateSchema = z.object({
  payload: messagePayloadSchema
});

export const conversationReadSchema = z.object({
  lastReadMessageId: idSchema
});

export const friendSummarySchema = z.object({
  user: publicUserSchema,
  conversationId: idSchema.nullable(),
  createdAt: timestampSchema
});

export const conversationSummarySchema = z.object({
  conversation: conversationSchema,
  participants: z.array(publicUserSchema).min(2).max(2),
  lastMessage: messageSchema.nullable(),
  readState: readStateSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
  typingUserIds: z.array(idSchema)
});

export const serverSocketEventNames = {
  sessionReady: "session.ready",
  presenceUpdated: "presence.updated",
  typingStarted: "typing.started",
  typingStopped: "typing.stopped",
  messageCreated: "message.created",
  messageUpdated: "message.updated",
  messageDeletedForSelf: "message.deletedForSelf",
  messageDeletedForEveryone: "message.deletedForEveryone",
  messageRead: "message.read",
  conversationSynced: "conversation.synced"
} as const;

export const clientSocketEventNames = {
  subscribeConversation: "conversation.subscribe",
  typingSet: "typing.set"
} as const;

export type PublicUser = z.infer<typeof publicUserSchema>;
export type PasswordCredential = z.infer<typeof passwordCredentialSchema>;
export type AuthIntent = z.infer<typeof authIntentSchema>;
export type FriendCodeRotation = z.infer<typeof friendCodeRotationSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type MessagePayload = z.infer<typeof messagePayloadSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageVisibility = z.infer<typeof messageVisibilitySchema>;
export type ReadState = z.infer<typeof readStateSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type FriendSummary = z.infer<typeof friendSummarySchema>;
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

