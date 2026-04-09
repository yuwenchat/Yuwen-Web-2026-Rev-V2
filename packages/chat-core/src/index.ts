import type {
  Conversation,
  Message,
  PublicUser,
  ReadState
} from "@yuwen/protocol";

export type ConversationSnapshot = {
  conversation: Conversation;
  participants: PublicUser[];
  messages: Message[];
  readState: ReadState | null;
  hiddenMessageIds: string[];
  typingUserIds: string[];
};

export type ChatState = {
  selfUserId: string;
  usersById: Record<string, PublicUser>;
  snapshotsById: Record<string, ConversationSnapshot>;
  activeConversationId: string | null;
};

export type ChatAction =
  | { type: "seed"; state: ChatState }
  | { type: "setActiveConversation"; conversationId: string }
  | { type: "messageReceived"; conversationId: string; message: Message }
  | { type: "messageEdited"; conversationId: string; messageId: string; text: string; editedAt: string }
  | { type: "messageDeletedForSelf"; conversationId: string; messageId: string }
  | { type: "messageDeletedForEveryone"; conversationId: string; messageId: string; deletedAt: string }
  | { type: "conversationRead"; conversationId: string; readState: ReadState }
  | { type: "typingUpdated"; conversationId: string; typingUserIds: string[] };

function upsertMessage(messages: Message[], nextMessage: Message): Message[] {
  const currentIndex = messages.findIndex((entry) => entry.id === nextMessage.id);

  if (currentIndex === -1) {
    return [...messages, nextMessage].sort((left, right) =>
      left.sentAt.localeCompare(right.sentAt)
    );
  }

  return messages.map((entry, index) =>
    index === currentIndex ? nextMessage : entry
  );
}

function updateSnapshot(
  state: ChatState,
  conversationId: string,
  updater: (snapshot: ConversationSnapshot) => ConversationSnapshot
): ChatState {
  const snapshot = state.snapshotsById[conversationId];

  if (!snapshot) {
    return state;
  }

  return {
    ...state,
    snapshotsById: {
      ...state.snapshotsById,
      [conversationId]: updater(snapshot)
    }
  };
}

export function createChatState(input: {
  selfUserId: string;
  users: PublicUser[];
  snapshots: ConversationSnapshot[];
  activeConversationId?: string | null;
}): ChatState {
  const usersById = Object.fromEntries(
    input.users.map((user) => [user.id, user] satisfies [string, PublicUser])
  );
  const snapshotsById = Object.fromEntries(
    input.snapshots.map((snapshot) => [
      snapshot.conversation.id,
      snapshot
    ] satisfies [string, ConversationSnapshot])
  );

  return {
    selfUserId: input.selfUserId,
    usersById,
    snapshotsById,
    activeConversationId:
      input.activeConversationId ?? input.snapshots[0]?.conversation.id ?? null
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "seed":
      return action.state;
    case "setActiveConversation":
      return {
        ...state,
        activeConversationId: action.conversationId
      };
    case "messageReceived":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        conversation: {
          ...snapshot.conversation,
          lastMessageId: action.message.id,
          updatedAt: action.message.sentAt
        },
        messages: upsertMessage(snapshot.messages, action.message)
      }));
    case "messageEdited":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        messages: snapshot.messages.map((message) =>
          message.id === action.messageId
            ? {
                ...message,
                payload: {
                  text: action.text
                },
                editedAt: action.editedAt
              }
            : message
        )
      }));
    case "messageDeletedForSelf":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        hiddenMessageIds: snapshot.hiddenMessageIds.includes(action.messageId)
          ? snapshot.hiddenMessageIds
          : [...snapshot.hiddenMessageIds, action.messageId]
      }));
    case "messageDeletedForEveryone":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        messages: snapshot.messages.map((message) =>
          message.id === action.messageId
            ? {
                ...message,
                deletedForEveryoneAt: action.deletedAt,
                tombstoneType: "deleted"
              }
            : message
        )
      }));
    case "conversationRead":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        readState: action.readState
      }));
    case "typingUpdated":
      return updateSnapshot(state, action.conversationId, (snapshot) => ({
        ...snapshot,
        typingUserIds: action.typingUserIds
      }));
    default:
      return state;
  }
}

export function selectVisibleMessages(
  state: ChatState,
  conversationId: string
): Message[] {
  const snapshot = state.snapshotsById[conversationId];

  if (!snapshot) {
    return [];
  }

  return snapshot.messages.filter(
    (message) => !snapshot.hiddenMessageIds.includes(message.id)
  );
}

export function selectConversationPreview(
  state: ChatState,
  conversationId: string
): string {
  const visibleMessages = selectVisibleMessages(state, conversationId);
  const latestMessage = visibleMessages.at(-1);

  if (!latestMessage) {
    return "还没有消息，开始聊点什么吧。";
  }

  if (latestMessage.deletedForEveryoneAt) {
    return "消息已删除";
  }

  return latestMessage.payload.text;
}

export function selectUnreadCount(
  state: ChatState,
  conversationId: string
): number {
  const snapshot = state.snapshotsById[conversationId];

  if (!snapshot) {
    return 0;
  }

  const readAtMessageId = snapshot.readState?.lastReadMessageId;
  const readIndex = snapshot.messages.findIndex(
    (message) => message.id === readAtMessageId
  );

  if (readIndex === -1) {
    return snapshot.messages.filter(
      (message) => message.senderUserId !== state.selfUserId
    ).length;
  }

  return snapshot.messages.slice(readIndex + 1).filter(
    (message) => message.senderUserId !== state.selfUserId
  ).length;
}

export function selectPartner(
  state: ChatState,
  conversationId: string
): PublicUser | null {
  const snapshot = state.snapshotsById[conversationId];

  if (!snapshot) {
    return null;
  }

  return (
    snapshot.participants.find((participant) => participant.id !== state.selfUserId) ??
    null
  );
}

export function selectMessageStatus(
  message: Message,
  readState: ReadState | null,
  selfUserId: string
): "sent" | "read" | "edited" | "deleted" | "incoming" {
  if (message.senderUserId !== selfUserId) {
    return "incoming";
  }

  if (message.deletedForEveryoneAt) {
    return "deleted";
  }

  if (message.editedAt) {
    return "edited";
  }

  if (readState?.lastReadMessageId === message.id) {
    return "read";
  }

  return "sent";
}

