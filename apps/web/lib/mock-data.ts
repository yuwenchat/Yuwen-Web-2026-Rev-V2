import type { ConversationSnapshot } from "@yuwen/chat-core";
import { createChatState } from "@yuwen/chat-core";
import type {
  Conversation,
  Message,
  PublicUser,
  ReadState
} from "@yuwen/protocol";

const now = Date.now();

export const currentUser: PublicUser = {
  id: "user-shawn",
  primaryEmail: "shawn@feishu.example",
  emailVerifiedAt: new Date(now - 1000 * 60 * 60).toISOString(),
  role: "admin",
  friendCode: "YW82Q4MN",
  handle: "shawn",
  profile: {
    displayName: "Shawn",
    bio: "把语闻做成一个克制、可信的聊天产品。"
  }
};

export const contacts: PublicUser[] = [
  {
    id: "user-lin",
    primaryEmail: "lin@studio.example",
    emailVerifiedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    role: "user",
    friendCode: "YW4P8K7R",
    handle: "lin",
    profile: {
      displayName: "Lin",
      bio: "喜欢安静但清晰的产品体验。"
    }
  },
  {
    id: "user-he",
    primaryEmail: "he@design.example",
    emailVerifiedAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    role: "user",
    friendCode: "YW6V3M9Q",
    handle: "he",
    profile: {
      displayName: "He",
      bio: "在移动端也想保留同样的安全感。"
    }
  }
];

const lin = contacts[0]!;
const he = contacts[1]!;

const conversations: Conversation[] = [
  {
    id: "conversation-lin",
    kind: "direct",
    securityMode: "transport_protected",
    participantIds: [currentUser.id, lin.id],
    lastMessageId: "message-4",
    createdAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 4).toISOString()
  },
  {
    id: "conversation-he",
    kind: "direct",
    securityMode: "e2ee_ready",
    participantIds: [currentUser.id, he.id],
    lastMessageId: "message-7",
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 14).toISOString()
  }
];

function messageFrom(input: {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  text: string;
  sentAt: string;
  editedAt?: string | null;
  deletedForEveryoneAt?: string | null;
}): Message {
  return {
    id: input.id,
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    senderDeviceId: input.senderDeviceId,
    payload: {
      text: input.text
    },
    payloadFormat: "plain_text",
    encryptionState: "transport_encrypted",
    sentAt: input.sentAt,
    editedAt: input.editedAt ?? null,
    deletedForEveryoneAt: input.deletedForEveryoneAt ?? null,
    tombstoneType: input.deletedForEveryoneAt ? "deleted" : "none"
  };
}

const messagesByConversation: Record<string, Message[]> = {
  "conversation-lin": [
    messageFrom({
      id: "message-1",
      conversationId: "conversation-lin",
      senderUserId: lin.id,
      senderDeviceId: "device-lin",
      text: "我喜欢你把安全提示写得很克制，不会让人误解成已经开启 E2EE。",
      sentAt: new Date(now - 1000 * 60 * 34).toISOString()
    }),
    messageFrom({
      id: "message-2",
      conversationId: "conversation-lin",
      senderUserId: currentUser.id,
      senderDeviceId: "device-web-primary",
      text: "是的，首发只会显示“连接与传输受保护”。",
      sentAt: new Date(now - 1000 * 60 * 26).toISOString()
    }),
    messageFrom({
      id: "message-3",
      conversationId: "conversation-lin",
      senderUserId: currentUser.id,
      senderDeviceId: "device-web-primary",
      text: "friend code 也会支持用户随时刷新，旧码立即失效。",
      sentAt: new Date(now - 1000 * 60 * 18).toISOString(),
      editedAt: new Date(now - 1000 * 60 * 17).toISOString()
    }),
    messageFrom({
      id: "message-4",
      conversationId: "conversation-lin",
      senderUserId: lin.id,
      senderDeviceId: "device-lin",
      text: "这样挺好，至少泄露之后不会一直被骚扰。",
      sentAt: new Date(now - 1000 * 60 * 4).toISOString()
    })
  ],
  "conversation-he": [
    messageFrom({
      id: "message-5",
      conversationId: "conversation-he",
      senderUserId: he.id,
      senderDeviceId: "device-he",
      text: "编辑消息和删除给双方最好和 Telegram 一样直观。",
      sentAt: new Date(now - 1000 * 60 * 54).toISOString()
    }),
    messageFrom({
      id: "message-6",
      conversationId: "conversation-he",
      senderUserId: currentUser.id,
      senderDeviceId: "device-web-primary",
      text: "我会保留“消息已删除”的占位，不让聊天错位。",
      sentAt: new Date(now - 1000 * 60 * 36).toISOString()
    }),
    messageFrom({
      id: "message-7",
      conversationId: "conversation-he",
      senderUserId: currentUser.id,
      senderDeviceId: "device-web-primary",
      text: "Magic Link 和验证码也会同时保留。",
      sentAt: new Date(now - 1000 * 60 * 14).toISOString(),
      deletedForEveryoneAt: new Date(now - 1000 * 60 * 8).toISOString()
    })
  ]
};

const readStates: Record<string, ReadState | null> = {
  "conversation-lin": {
    conversationId: "conversation-lin",
    userId: currentUser.id,
    lastReadMessageId: "message-4",
    readAt: new Date(now - 1000 * 60 * 4).toISOString()
  },
  "conversation-he": {
    conversationId: "conversation-he",
    userId: currentUser.id,
    lastReadMessageId: "message-6",
    readAt: new Date(now - 1000 * 60 * 18).toISOString()
  }
};

export function buildDemoChatState() {
  const snapshots: ConversationSnapshot[] = conversations.map((conversation) => ({
    conversation,
    participants: [currentUser, ...contacts].filter((user) =>
      conversation.participantIds.includes(user.id)
    ),
    messages: messagesByConversation[conversation.id] ?? [],
    readState: readStates[conversation.id] ?? null,
    hiddenMessageIds: [],
    typingUserIds: conversation.id === "conversation-he" ? [he.id] : []
  }));

  return createChatState({
    selfUserId: currentUser.id,
    users: [currentUser, ...contacts],
    activeConversationId: conversations[0]!.id,
    snapshots
  });
}

export function createLocalMessage(input: {
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  text: string;
  sentAt: string;
}): Message {
  return messageFrom({
    id: `message-local-${Math.random().toString(36).slice(2, 8)}`,
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    senderDeviceId: input.senderDeviceId,
    text: input.text,
    sentAt: input.sentAt
  });
}

export function createPartnerReply(input: {
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  basedOn: string;
}): Message {
  const seeds = [
    "我看到这条了，已读状态和编辑痕迹会一起更新。",
    "这个方向挺稳，移动端以后直接复用状态层就好。",
    "可以，把安全提示和登录路径都讲清楚会更有信任感。"
  ];
  const text =
    seeds[Math.abs(input.basedOn.length) % seeds.length] ?? "我看到这条了。";

  return messageFrom({
    id: `message-reply-${Math.random().toString(36).slice(2, 8)}`,
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    senderDeviceId: input.senderDeviceId,
    text,
    sentAt: new Date().toISOString()
  });
}
