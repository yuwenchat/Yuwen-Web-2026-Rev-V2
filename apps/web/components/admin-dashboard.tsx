"use client";

import type {
  AdminAuthIntent,
  AdminConversation,
  AdminConversationMessage,
  AdminFriendCodeRotation,
  AdminOverview,
  AdminUser,
  AuthSession
} from "@yuwen/protocol";
import Link from "next/link";
import { Activity, KeyRound, RefreshCcw, Search, ShieldAlert, Users } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react";

import { adminApi, authApi } from "../lib/api-client";

type AdminState = {
  overview: AdminOverview | null;
  users: AdminUser[];
  conversations: AdminConversation[];
  authIntents: AdminAuthIntent[];
  rotations: AdminFriendCodeRotation[];
  selectedConversationId: string | null;
  selectedConversationMessages: AdminConversationMessage[];
};

const initialState: AdminState = {
  overview: null,
  users: [],
  conversations: [],
  authIntents: [],
  rotations: [],
  selectedConversationId: null,
  selectedConversationMessages: []
};

const adminFirstRunSteps = [
  {
    step: "01",
    title: "先确定邮箱有 ADMIN 角色",
    body: "把后台邮箱写进 ADMIN_EMAILS。只有命中这份配置的账号，登录后才会被认作管理员。"
  },
  {
    step: "02",
    title: "注册后补一个密码",
    body: "如果管理员最初是通过验证码或 Magic Link 注册，建议立刻设置密码，后面登录后台会更直接。"
  },
  {
    step: "03",
    title: "再进入 /admin",
    body: "后台复用普通登录接口，但会额外校验角色。普通用户账号即使登录成功，也无法访问管理数据。"
  }
];

export function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AdminState>(initialState);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startLoading] = useTransition();

  useEffect(() => {
    const persisted = window.localStorage.getItem("yuwen-admin-session");

    if (!persisted) {
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as AuthSession;
      setSession(parsed);
      setEmail(parsed.user.primaryEmail);
    } catch {
      window.localStorage.removeItem("yuwen-admin-session");
    }
  }, []);

  const stats = useMemo(() => {
    if (!state.overview) {
      return [];
    }

    return [
      {
        label: "总用户数",
        value: state.overview.totals.users,
        icon: Users
      },
      {
        label: "总会话数",
        value: state.overview.totals.conversations,
        icon: Activity
      },
      {
        label: "消息总量",
        value: state.overview.totals.messages,
        icon: RefreshCcw
      },
      {
        label: "24h 认证请求",
        value: state.overview.totals.authIntentsLast24Hours,
        icon: KeyRound
      }
    ];
  }, [state.overview]);

  function loadDashboard(nextQuery = query) {
    if (!session?.accessToken) {
      setError("请先使用管理员账号登录。");
      return;
    }

    startLoading(() => {
      void (async () => {
        setError(null);

        try {
          const [overview, users, conversations, authIntents, rotations] =
            await Promise.all([
              adminApi.getOverview(session.accessToken),
              adminApi.listUsers(session.accessToken, nextQuery),
              adminApi.listConversations(session.accessToken, nextQuery),
              adminApi.listAuthIntents(session.accessToken, nextQuery),
              adminApi.listFriendCodeRotations(session.accessToken, nextQuery)
            ]);

          let selectedConversationId = state.selectedConversationId;
          if (
            !selectedConversationId ||
            !conversations.some(
              (conversation) => conversation.id === selectedConversationId
            )
          ) {
            selectedConversationId = conversations[0]?.id ?? null;
          }

          const selectedConversationMessages = selectedConversationId
            ? await adminApi.listConversationMessages(
                session.accessToken,
                selectedConversationId
              )
            : [];

          setState({
            overview,
            users,
            conversations,
            authIntents,
            rotations,
            selectedConversationId,
            selectedConversationMessages
          });
        } catch (loadError) {
          const message =
            loadError instanceof Error ? loadError.message : "后台加载失败。";
          setError(message);
        }
      })();
    });
  }

  function selectConversation(conversationId: string) {
    if (!session?.accessToken) {
      return;
    }

    startLoading(() => {
      void (async () => {
        try {
          const messages = await adminApi.listConversationMessages(
            session.accessToken,
            conversationId
          );

          setState((current) => ({
            ...current,
            selectedConversationId: conversationId,
            selectedConversationMessages: messages
          }));
        } catch (loadError) {
          const message =
            loadError instanceof Error ? loadError.message : "会话消息加载失败。";
          setError(message);
        }
      })();
    });
  }

  function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("请输入管理员邮箱和密码。");
      return;
    }

    startLoading(() => {
      void (async () => {
        try {
          setError(null);
          const nextSession = await authApi.loginWithPassword(
            email.trim(),
            password
          );

          if (nextSession.user.role !== "admin") {
            setSession(null);
            window.localStorage.removeItem("yuwen-admin-session");
            setError("这个账号已登录成功，但它不是管理员账号。");
            return;
          }

          setSession(nextSession);
          setEmail(nextSession.user.primaryEmail);
          setPassword("");
          window.localStorage.setItem(
            "yuwen-admin-session",
            JSON.stringify(nextSession)
          );
        } catch (loadError) {
          const message =
            loadError instanceof Error ? loadError.message : "管理员登录失败。";
          setError(message);
        }
      })();
    });
  }

  function logoutAdmin() {
    setSession(null);
    setState(initialState);
    setPassword("");
    window.localStorage.removeItem("yuwen-admin-session");
  }

  useEffect(() => {
    if (session?.user.role === "admin" && !state.overview) {
      void loadDashboard("");
    }
  }, [session, state.overview]);

  return (
    <section className="admin-layout">
      <section className="surface panel">
        <div className="panel-header">
          <p className="eyebrow">Admin Access</p>
          <h2 className="section-title serif">只有管理员账号能进入后台。</h2>
          <p className="muted">
            管理后台现在复用正常账号体系登录，但只有后端角色为 `ADMIN` 的账号才能访问后台接口。普通用户即使登录成功，也会被拦在后台之外。
          </p>
          <p className="muted">
            如果管理员账号最初是通过验证码或 Magic Link 注册的，请先在应用内设置密码，再用邮箱密码登录后台。
          </p>
        </div>

        <div className="panel-body stack">
          <div className="admin-guide">
            <div className="admin-guide-copy">
              <p className="eyebrow">Admin Onboarding</p>
              <h3 className="admin-guide-title">
                {session?.user.role === "admin"
                  ? "当前账号已经通过管理员校验。"
                  : "第一次进入后台，先把这三步走清楚。"}
              </h3>
              <p className="muted">
                后台现在不再使用独立口令，而是直接复用账号角色。这样登录方式更统一，多设备和审计语义也更自然。
              </p>
            </div>
            <div className="admin-guide-grid">
              {adminFirstRunSteps.map((item) => (
                <article className="admin-guide-card" key={item.step}>
                  <span className="step-badge">{item.step}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="button-row">
              <Link className="secondary-button" href="/onboarding">
                查看完整 onboarding
              </Link>
              <Link className="ghost-button" href="/settings">
                先去设置密码与语闻号
              </Link>
            </div>
          </div>

          {session?.user.role === "admin" ? (
            <div className="admin-toolbar">
              <div className="key-value" style={{ flex: 1 }}>
                <span className="label">当前管理员</span>
                <strong>
                  {session.user.profile.displayName} · @{session.user.handle}
                </strong>
                <span className="muted">{session.user.primaryEmail}</span>
              </div>
              <label className="field" style={{ flex: 1 }}>
                <span className="label">搜索用户 / 邮箱 / 会话</span>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: 16,
                      color: "rgba(16, 40, 68, 0.45)"
                    }}
                  />
                  <input
                    className="input"
                    style={{ paddingLeft: 42 }}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="支持邮箱、@handle、friend code"
                  />
                </div>
              </label>
              <div className="button-row">
                <button
                  className="primary-button"
                  onClick={() => loadDashboard(query)}
                  type="button"
                >
                  刷新后台
                </button>
                <button
                  className="secondary-button"
                  onClick={logoutAdmin}
                  type="button"
                >
                  退出后台
                </button>
              </div>
            </div>
          ) : (
            <form className="admin-toolbar" onSubmit={handleAdminLogin}>
              <label className="field" style={{ flex: 1 }}>
                <span className="label">管理员邮箱</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="label">密码</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入管理员账号密码"
                />
              </label>
              <div className="button-row">
                <button className="primary-button" type="submit">
                  登录后台
                </button>
              </div>
            </form>
          )}

          {error ? (
            <div className="notice">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={16} />
                <strong>后台状态</strong>
              </div>
              <div>{error}</div>
            </div>
          ) : null}

          {session?.user.role === "admin" ? (
            <>
              <div className="admin-stats">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="admin-stat-card" key={item.label}>
                      <div className="status-pill">
                        <Icon size={14} />
                        {item.label}
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="admin-grid">
                <section className="surface admin-section">
                  <div className="admin-section-header">
                    <h3>用户</h3>
                    <span className="status-pill">{state.users.length} 条</span>
                  </div>
                  <div className="admin-list">
                    {state.users.map((entry) => (
                      <div className="admin-row" key={entry.user.id}>
                        <div>
                          <strong>{entry.user.profile.displayName}</strong>
                          <div className="muted">{entry.user.primaryEmail}</div>
                        </div>
                        <div className="admin-row-meta">
                          <span className="status-pill">
                            {entry.user.role === "admin" ? "管理员" : "普通用户"}
                          </span>
                          <span className="status-pill">@{entry.user.handle}</span>
                          <span className="status-pill mono">
                            {entry.user.friendCode}
                          </span>
                          <span className="status-pill">
                            设备 {entry.devicesCount} / 会话 {entry.sessionsCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="surface admin-section">
                  <div className="admin-section-header">
                    <h3>会话</h3>
                    <span className="status-pill">{state.conversations.length} 条</span>
                  </div>
                  <div className="admin-list">
                    {state.conversations.map((conversation) => (
                      <button
                        className={`admin-row admin-button ${
                          state.selectedConversationId === conversation.id
                            ? "active"
                            : ""
                        }`}
                        key={conversation.id}
                        onClick={() => selectConversation(conversation.id)}
                        type="button"
                      >
                        <div>
                          <strong>
                            {conversation.participants
                              .map((participant) => participant.displayName)
                              .join(" / ")}
                          </strong>
                          <div className="muted">{conversation.id}</div>
                        </div>
                        <div className="admin-row-meta">
                          <span className="security-pill">
                            {conversation.securityMode}
                          </span>
                          <span className="status-pill">
                            {conversation.messageCount} 条消息
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="admin-grid">
                <section className="surface admin-section">
                  <div className="admin-section-header">
                    <h3>认证记录</h3>
                    <span className="status-pill">{state.authIntents.length} 条</span>
                  </div>
                  <div className="admin-list">
                    {state.authIntents.map((entry) => (
                      <div className="admin-row" key={entry.id}>
                        <div>
                          <strong>{entry.email}</strong>
                          <div className="muted">
                            {entry.purpose} / {entry.channel} / attempts{" "}
                            {entry.attempts}
                          </div>
                        </div>
                        <div className="admin-row-meta">
                          <span className="status-pill">
                            {entry.consumedAt ? "已消费" : "未消费"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="surface admin-section">
                  <div className="admin-section-header">
                    <h3>friend code 轮换</h3>
                    <span className="status-pill">{state.rotations.length} 条</span>
                  </div>
                  <div className="admin-list">
                    {state.rotations.map((entry) => (
                      <div className="admin-row" key={entry.id}>
                        <div>
                          <strong>@{entry.handle}</strong>
                          <div className="muted">{entry.primaryEmail}</div>
                        </div>
                        <div className="admin-row-meta">
                          <span className="status-pill mono">{entry.oldCode}</span>
                          <span className="status-pill mono">{entry.newCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="surface admin-section">
                <div className="admin-section-header">
                  <h3>当前选中会话的最近消息</h3>
                  <span className="status-pill">
                    {state.selectedConversationMessages.length} 条
                  </span>
                </div>
                <div className="admin-list">
                  {state.selectedConversationMessages.map((message) => (
                    <div className="admin-row" key={message.id}>
                      <div>
                        <strong>{message.senderDisplayName}</strong>
                        <div className="muted">{message.text || "消息已删除"}</div>
                      </div>
                      <div className="admin-row-meta">
                        {message.editedAt ? (
                          <span className="status-pill">已编辑</span>
                        ) : null}
                        {message.deletedForEveryoneAt ? (
                          <span className="status-pill">已对双方删除</span>
                        ) : null}
                        <span className="status-pill">
                          {new Date(message.sentAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="notice">
              用管理员账号邮箱和密码登录后，后台会自动请求 `/admin/*` 接口。如果这个账号不是
              `ADMIN`，后端会直接拒绝访问。
            </div>
          )}

          {isPending ? <div className="notice">后台数据加载中…</div> : null}
        </div>
      </section>
    </section>
  );
}
