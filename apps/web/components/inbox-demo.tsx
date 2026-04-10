"use client";

import { startTransition, useDeferredValue, useReducer, useState } from "react";
import {
  Lock,
  Pencil,
  RefreshCcw,
  Search,
  Send,
  Shield
} from "lucide-react";

import {
  chatReducer,
  selectConversationPreview,
  selectMessageStatus,
  selectPartner,
  selectUnreadCount,
  selectVisibleMessages
} from "@yuwen/chat-core";
import { emojiFingerprintFromSeed, securityModeSummary } from "@yuwen/crypto";
import { messageStatusCopy, securityModeCopy } from "@yuwen/design-system";

import { buildDemoChatState, createLocalMessage, createPartnerReply } from "../lib/mock-data";

export function InboxDemo() {
  const [state, dispatch] = useReducer(chatReducer, undefined, buildDemoChatState);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [typingBanner, setTypingBanner] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const fallbackConversationId =
    Object.values(state.snapshotsById)[0]?.conversation.id ?? null;

  const activeConversationId = state.activeConversationId ?? fallbackConversationId;
  const activeSnapshot = activeConversationId
    ? state.snapshotsById[activeConversationId]
    : null;
  const activePartner = activeConversationId
    ? selectPartner(state, activeConversationId)
    : null;
  const activeMessages = activeConversationId
    ? selectVisibleMessages(state, activeConversationId)
    : [];

  const filteredSnapshots = Object.values(state.snapshotsById).filter((snapshot) => {
    const partner = snapshot.participants.find(
      (participant) => participant.id !== state.selfUserId
    );

    if (!partner) {
      return false;
    }

    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [partner.profile.displayName, partner.handle, partner.friendCode]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  function markConversationRead(conversationId: string) {
    const lastMessage = selectVisibleMessages(state, conversationId).at(-1);

    if (!lastMessage) {
      return;
    }

    dispatch({
      type: "conversationRead",
      conversationId,
      readState: {
        conversationId,
        userId: state.selfUserId,
        lastReadMessageId: lastMessage.id,
        readAt: new Date().toISOString()
      }
    });
  }

  function switchConversation(conversationId: string) {
    startTransition(() => {
      dispatch({
        type: "setActiveConversation",
        conversationId
      });
      markConversationRead(conversationId);
    });
  }

  function handleSendMessage() {
    if (!activeConversationId || !composer.trim() || !activePartner) {
      return;
    }

    const draftText = composer.trim();
    const sentAt = new Date().toISOString();
    const outgoing = createLocalMessage({
      conversationId: activeConversationId,
      senderUserId: state.selfUserId,
      senderDeviceId: "device-web-primary",
      text: draftText,
      sentAt
    });

    startTransition(() => {
      dispatch({
        type: "messageReceived",
        conversationId: activeConversationId,
        message: outgoing
      });
      dispatch({
        type: "conversationRead",
        conversationId: activeConversationId,
        readState: {
          conversationId: activeConversationId,
          userId: state.selfUserId,
          lastReadMessageId: outgoing.id,
          readAt: sentAt
        }
      });
      setComposer("");
      setTypingBanner(true);
      dispatch({
        type: "typingUpdated",
        conversationId: activeConversationId,
        typingUserIds: [activePartner.id]
      });
    });

    window.setTimeout(() => {
      startTransition(() => {
        dispatch({
          type: "typingUpdated",
          conversationId: activeConversationId,
          typingUserIds: []
        });

        const reply = createPartnerReply({
          conversationId: activeConversationId,
          senderUserId: activePartner.id,
          senderDeviceId: "device-partner",
          basedOn: draftText
        });

        dispatch({
          type: "messageReceived",
          conversationId: activeConversationId,
          message: reply
        });
        dispatch({
          type: "conversationRead",
          conversationId: activeConversationId,
          readState: {
            conversationId: activeConversationId,
            userId: state.selfUserId,
            lastReadMessageId: reply.id,
            readAt: reply.sentAt
          }
        });
        setTypingBanner(false);
      });
    }, 1400);
  }

  function beginEdit(messageId: string, currentText: string) {
    setEditingMessageId(messageId);
    setEditingText(currentText);
  }

  function saveEdit() {
    if (!activeConversationId || !editingMessageId || !editingText.trim()) {
      return;
    }

    dispatch({
      type: "messageEdited",
      conversationId: activeConversationId,
      messageId: editingMessageId,
      text: editingText.trim(),
      editedAt: new Date().toISOString()
    });
    setEditingMessageId(null);
    setEditingText("");
  }

  function deleteForSelf(messageId: string) {
    if (!activeConversationId) {
      return;
    }

    dispatch({
      type: "messageDeletedForSelf",
      conversationId: activeConversationId,
      messageId
    });
  }

  function deleteForEveryone(messageId: string) {
    if (!activeConversationId) {
      return;
    }

    dispatch({
      type: "messageDeletedForEveryone",
      conversationId: activeConversationId,
      messageId,
      deletedAt: new Date().toISOString()
    });
  }

  const securityCopy = activeSnapshot
    ? securityModeCopy[activeSnapshot.conversation.securityMode]
    : null;
  const fingerprint = activeSnapshot
    ? emojiFingerprintFromSeed(activeSnapshot.conversation.id)
    : [];

  return (
    <section className="workspace">
      <aside className="surface panel">
        <div className="panel-header stack">
          <div>
            <p className="eyebrow">Conversations</p>
            <h2 className="section-title serif">用状态，而不是杂讯来导航。</h2>
          </div>

          <label className="field">
            <span className="label">搜索 friend code / 语闻号 / 名称</span>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 16, top: 16, color: "rgba(16, 40, 68, 0.45)" }}
              />
              <input
                className="input"
                style={{ paddingLeft: 42 }}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="例如 YW82Q4MN / @lin"
              />
            </div>
          </label>
        </div>

        <div className="panel-body sidebar-list">
          {filteredSnapshots.map((snapshot) => {
            const partner = snapshot.participants.find(
              (participant) => participant.id !== state.selfUserId
            );

            if (!partner) {
              return null;
            }

            const unreadCount = selectUnreadCount(state, snapshot.conversation.id);

            return (
              <button
                key={snapshot.conversation.id}
                className={`conversation-row ${
                  snapshot.conversation.id === activeConversationId ? "active" : ""
                }`}
                onClick={() => switchConversation(snapshot.conversation.id)}
                type="button"
              >
                <div className="conversation-meta">
                  <span className="conversation-name">
                    {partner.profile.displayName}
                  </span>
                  {unreadCount > 0 ? <span className="count-pill">{unreadCount}</span> : null}
                </div>
                <span className="conversation-preview">
                  {selectConversationPreview(state, snapshot.conversation.id)}
                </span>
                <div className="conversation-meta">
                  <span className="status-pill">@{partner.handle}</span>
                  <span className="status-pill mono">{partner.friendCode}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="surface panel thread-main">
        {activeSnapshot && activePartner ? (
          <>
            <div className="panel-header thread-header">
              <div className="stack" style={{ gap: 8 }}>
                <div>
                  <p className="eyebrow">Direct Conversation</p>
                  <h2 className="section-title serif" style={{ margin: 0 }}>
                    {activePartner.profile.displayName}
                  </h2>
                </div>
                <div className="button-row">
                  <span className="security-pill">
                    <Lock size={14} />
                    {securityCopy?.label}
                  </span>
                  <span className="status-pill mono">{activePartner.friendCode}</span>
                </div>
              </div>

              <div className="stack" style={{ gap: 8, maxWidth: 320 }}>
                <span className="muted">
                  这条会话当前不会误导显示 “E2EE 已开启”，但协议和设备模型已为后续升级预留。
                </span>
                {typingBanner || activeSnapshot.typingUserIds.length > 0 ? (
                  <span className="typing-pill">对方正在输入…</span>
                ) : null}
              </div>
            </div>

            <div className="messages">
              {activeMessages.map((message) => {
                const isSelf = message.senderUserId === state.selfUserId;
                const isEditing = editingMessageId === message.id;
                const status = selectMessageStatus(
                  message,
                  activeSnapshot.readState,
                  state.selfUserId
                );

                return (
                  <div
                    key={message.id}
                    className={`message-wrap ${isSelf ? "self" : ""}`}
                  >
                    <div
                      className={`message-bubble ${
                        message.deletedForEveryoneAt ? "deleted" : ""
                      }`}
                    >
                      {isEditing ? (
                        <div className="stack">
                          <textarea
                            className="textarea"
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                          />
                          <div className="button-row">
                            <button className="primary-button" onClick={saveEdit} type="button">
                              保存编辑
                            </button>
                            <button
                              className="secondary-button"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText("");
                              }}
                              type="button"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="message-copy">
                            {message.deletedForEveryoneAt
                              ? "消息已删除"
                              : message.payload.text}
                          </div>
                          <div className="message-footer">
                            <span>
                              {new Date(message.sentAt).toLocaleTimeString("zh-CN", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                              {messageStatusCopy[status]
                                ? ` · ${messageStatusCopy[status]}`
                                : ""}
                            </span>
                            {isSelf && !message.deletedForEveryoneAt ? (
                              <div className="message-actions">
                                <button
                                  className="text-button"
                                  onClick={() => beginEdit(message.id, message.payload.text)}
                                  type="button"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="text-button"
                                  onClick={() => deleteForSelf(message.id)}
                                  type="button"
                                >
                                  仅自己删除
                                </button>
                                <button
                                  className="text-button"
                                  onClick={() => deleteForEveryone(message.id)}
                                  type="button"
                                >
                                  给双方删除
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="composer">
              <label className="field">
                <span className="label">写一条消息</span>
                <textarea
                  className="textarea"
                  placeholder="语闻的消息编辑和删除在这里直接可见。"
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                />
              </label>

              <div className="button-row">
                <button className="primary-button" onClick={handleSendMessage} type="button">
                  <Send size={16} />
                  发送消息
                </button>
                <button
                  className="secondary-button"
                  onClick={() => activeConversationId && markConversationRead(activeConversationId)}
                  type="button"
                >
                  标记为已读
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <aside className="surface panel">
        <div className="panel-header">
          <p className="eyebrow">Inspector</p>
          <h2 className="section-title serif">安全状态与会话语义</h2>
        </div>

        <div className="panel-body">
          {activeSnapshot && securityCopy ? (
            <>
              <section className="inspector-section">
                <span className="security-pill">
                  <Shield size={14} />
                  {securityCopy.label}
                </span>
                <p className="muted">{securityCopy.description}</p>
                <p className="muted">
                  {securityModeSummary(activeSnapshot.conversation.securityMode)}
                </p>
              </section>

              <section className="inspector-section">
                <p className="eyebrow">Emoji Fingerprint Placeholder</p>
                <div className="emoji-row">
                  {fingerprint.map((emoji, index) => (
                    <span key={`${emoji}-${index}`}>{emoji}</span>
                  ))}
                </div>
                <p className="muted">
                  这些 emoji 现在只是将来 E2EE 指纹展示的预留位。真正启用前，不会把它们描述成秘钥。
                </p>
              </section>

              <section className="inspector-section">
                <p className="eyebrow">会话规则</p>
                <ul className="utility-list">
                  <li>删除给双方会保留“消息已删除”占位，避免上下文错位。</li>
                  <li>删除给自己是账号级隐藏，并同步到你的所有设备。</li>
                  <li>消息可随时编辑；编辑后双方都看到最新版本和“已编辑”标记。</li>
                </ul>
              </section>
            </>
          ) : null}

          <section className="inspector-section">
            <div className="code-display">
              <div>
                <div className="label">friend code</div>
                <strong className="mono">YW82Q4MN</strong>
              </div>
              <button className="secondary-button" type="button">
                <RefreshCcw size={15} />
                刷新
              </button>
            </div>
          </section>
        </div>
      </aside>
    </section>
  );
}
