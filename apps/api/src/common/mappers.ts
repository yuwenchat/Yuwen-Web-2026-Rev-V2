import type {
  Conversation as PrismaConversation,
  Device as PrismaDevice,
  Message as PrismaMessage,
  ReadState as PrismaReadState,
  User as PrismaUser
} from "@prisma/client";
import type {
  Conversation,
  Device,
  Message,
  MessagePayload,
  PublicUser,
  ReadState
} from "@yuwen/protocol";

function lowerEnum<T extends string>(value: T): Lowercase<T> {
  return value.toLowerCase() as Lowercase<T>;
}

export function toProtocolUser(user: PrismaUser): PublicUser {
  return {
    id: user.id,
    primaryEmail: user.primaryEmail,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    role: lowerEnum(user.role),
    friendCode: user.friendCode,
    handle: user.handle,
    profile: {
      displayName: user.displayName,
      bio: user.bio
    }
  };
}

export function toProtocolDevice(device: PrismaDevice): Device {
  return {
    id: device.id,
    userId: device.userId,
    platform: lowerEnum(device.platform),
    name: device.name,
    lastSeenAt: device.lastSeenAt.toISOString(),
    trustState: lowerEnum(device.trustState)
  };
}

export function toProtocolConversation(
  conversation: PrismaConversation,
  participantIds: string[]
): Conversation {
  return {
    id: conversation.id,
    kind: lowerEnum(conversation.kind),
    securityMode: lowerEnum(conversation.securityMode),
    participantIds,
    lastMessageId: conversation.lastMessageId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  };
}

function coercePayload(payload: unknown): MessagePayload {
  const text =
    typeof payload === "object" && payload && "text" in payload
      ? String((payload as { text: unknown }).text)
      : "";

  return {
    text
  };
}

export function toProtocolMessage(message: PrismaMessage): Message {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    senderDeviceId: message.senderDeviceId,
    payload: coercePayload(message.payload),
    payloadFormat: lowerEnum(message.payloadFormat),
    encryptionState: lowerEnum(message.encryptionState),
    sentAt: message.sentAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedForEveryoneAt: message.deletedForEveryoneAt?.toISOString() ?? null,
    tombstoneType: lowerEnum(message.tombstoneType)
  };
}

export function toProtocolReadState(readState: PrismaReadState): ReadState {
  return {
    conversationId: readState.conversationId,
    userId: readState.userId,
    lastReadMessageId: readState.lastReadMessageId,
    readAt: readState.readAt.toISOString()
  };
}
