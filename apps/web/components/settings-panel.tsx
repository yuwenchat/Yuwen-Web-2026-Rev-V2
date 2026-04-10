"use client";

import type { AuthSession } from "@yuwen/protocol";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";

import { e2eeRoadmap, emojiFingerprintFromSeed } from "@yuwen/crypto";
import { authEntryCopy, securityModeCopy } from "@yuwen/design-system";

import {
  authApi,
  readUserSession
} from "../lib/api-client";

export function SettingsPanel() {
  const [displayName, setDisplayName] = useState("Shawn");
  const [bio, setBio] = useState("在语闻里把隐私感和简洁度一起做好。");
  const [handle, setHandle] = useState("shawn");
  const [friendCode, setFriendCode] = useState("YW82Q4MN");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const deferredHandle = useDeferredValue(handle);
  const fingerprint = emojiFingerprintFromSeed(`settings:${friendCode}`);

  useEffect(() => {
    const persisted = readUserSession();

    if (persisted) {
      setSession(persisted);
    }
  }, []);

  function rotateFriendCode() {
    startTransition(() => {
      const nextCode = `YW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setFriendCode(nextCode);
      setNotice("已模拟调用 /me/friend-code/rotate，旧 code 会立即失效。");
    });
  }

  function saveProfile() {
    startTransition(() => {
      setNotice(
        `已模拟调用 /me/profile，新的语闻号会保存为 @${deferredHandle.replace(/^@+/, "")}。`
      );
    });
  }

  function savePassword() {
    if (!session?.accessToken) {
      setNotice("请先通过验证码、Magic Link 或密码登录，再来补设置密码。");
      return;
    }

    if (password.length < 8) {
      setNotice("密码至少需要 8 位。");
      return;
    }

    if (password !== passwordConfirm) {
      setNotice("两次输入的密码不一致。");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await authApi.setPassword(session.accessToken, password);
          setPassword("");
          setPasswordConfirm("");
          setNotice("密码已经设置成功。现在你可以回到 /admin 用邮箱和这个密码登录后台。");
        } catch (error) {
          setNotice(
            error instanceof Error ? error.message : "设置密码失败，请稍后再试。"
          );
        }
      })();
    });
  }

  return (
    <section className="settings-layout">
      <div className="surface panel">
        <div className="panel-header">
          <p className="eyebrow">Identity Controls</p>
          <h2 className="section-title serif">稳定身份靠语闻号，临时入口交给 friend code。</h2>
          <p className="muted">
            `@handle` 适合长期展示，friend code 则为了加好友低摩擦和可轮换。两者角色分开，泄露风险会更可控。
          </p>
        </div>

        <div className="panel-body stack">
          <div className="settings-grid">
            <label className="field">
              <span className="label">显示名称</span>
              <input
                className="input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="label">语闻号</span>
              <input
                className="input"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="label">简介</span>
            <textarea
              className="textarea"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </label>

          <div className="surface" style={{ padding: 18, display: "grid", gap: 14 }}>
            <div>
              <p className="eyebrow">Password Setup</p>
              <h3 className="section-title serif" style={{ fontSize: "1.6rem" }}>
                给当前账号补一个后台可用的密码。
              </h3>
              <p className="muted">
                {session?.user.primaryEmail
                  ? `当前已识别登录邮箱：${session.user.primaryEmail}`
                  : "如果你刚通过验证码或 Magic Link 注册，请先完成登录，系统会把会话保存在浏览器里。"}
              </p>
            </div>

            <div className="settings-grid">
              <label className="field">
                <span className="label">新密码</span>
                <input
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 位"
                  type="password"
                />
              </label>

              <label className="field">
                <span className="label">确认密码</span>
                <input
                  className="input"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="再次输入密码"
                  type="password"
                />
              </label>
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={savePassword} type="button">
                <KeyRound size={16} />
                设置密码
              </button>
            </div>
          </div>

          <div className="code-display">
            <div>
              <div className="label">当前 friend code</div>
              <strong className="mono">{friendCode}</strong>
            </div>
            <div className="button-row">
              <button className="secondary-button" onClick={rotateFriendCode} type="button">
                <RefreshCcw size={16} />
                立刻刷新
              </button>
              <button className="primary-button" onClick={saveProfile} type="button">
                保存资料
              </button>
            </div>
          </div>

          {notice ? <div className="notice">{notice}</div> : null}

          <div className="mini-grid">
            {authEntryCopy.map((item) => (
              <div className="surface" key={item.key}>
                <strong>{item.title}</strong>
                <span className="muted">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="surface panel">
        <div className="panel-header">
          <p className="eyebrow">Security</p>
          <h2 className="section-title serif">真实表达当前安全能力。</h2>
        </div>

        <div className="panel-body stack">
          <div className="key-value">
            <span className="security-pill">
              <ShieldCheck size={14} />
              {securityModeCopy.transport_protected.label}
            </span>
            <span className="muted">{securityModeCopy.transport_protected.description}</span>
          </div>

          <div className="key-value">
            <span className="label">将来的 emoji 指纹展示</span>
            <div className="emoji-row">
              {fingerprint.map((emoji, index) => (
                <span key={`${emoji}-${index}`}>{emoji}</span>
              ))}
            </div>
            <span className="muted">
              当前只是安全可视化的预留位，后续接入 E2EE 时再和真实会话指纹绑定。
            </span>
          </div>

          <div className="key-value">
            <span className="label">E2EE 路线图</span>
            <ul className="utility-list">
              {e2eeRoadmap.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="key-value">
            <span className="label">密码策略</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <KeyRound size={16} />
              <strong>保留密码作为稳定兜底</strong>
            </div>
            <span className="muted">
              即使验证码或 magic link 邮件暂时延迟，也不会让用户完全失去登录入口。
            </span>
          </div>
        </div>
      </aside>
    </section>
  );
}
