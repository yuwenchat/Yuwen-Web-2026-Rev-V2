import { describe, expect, it } from "vitest";

import {
  chatReducer,
  selectConversationPreview,
  selectVisibleMessages
} from "@yuwen/chat-core";

import { buildDemoChatState, createLocalMessage } from "../apps/web/lib/mock-data";

describe("chat-core reducer", () => {
  it("edits a message in place and keeps the conversation preview in sync", () => {
    const initialState = buildDemoChatState();
    const nextState = chatReducer(initialState, {
      type: "messageEdited",
      conversationId: "conversation-lin",
      messageId: "message-3",
      text: "friend code 现在支持手动刷新并立即让旧码失效。",
      editedAt: new Date().toISOString()
    });

    const preview = selectConversationPreview(nextState, "conversation-lin");

    expect(preview).toContain("泄露之后");
    expect(
      selectVisibleMessages(nextState, "conversation-lin").find(
        (message) => message.id === "message-3"
      )?.editedAt
    ).not.toBeNull();
  });

  it("hides a message only for the current user on delete-for-self", () => {
    const initialState = buildDemoChatState();
    const nextState = chatReducer(initialState, {
      type: "messageDeletedForSelf",
      conversationId: "conversation-lin",
      messageId: "message-2"
    });

    expect(
      selectVisibleMessages(nextState, "conversation-lin").some(
        (message) => message.id === "message-2"
      )
    ).toBe(false);
  });

  it("adds an optimistic local message and exposes it in the visible timeline", () => {
    const initialState = buildDemoChatState();
    const outgoing = createLocalMessage({
      conversationId: "conversation-lin",
      senderUserId: "user-shawn",
      senderDeviceId: "device-web-primary",
      text: "先把 Web 做稳，再往移动端扩。",
      sentAt: new Date().toISOString()
    });
    const nextState = chatReducer(initialState, {
      type: "messageReceived",
      conversationId: "conversation-lin",
      message: outgoing
    });

    expect(
      selectVisibleMessages(nextState, "conversation-lin").at(-1)?.id
    ).toBe(outgoing.id);
  });
});

