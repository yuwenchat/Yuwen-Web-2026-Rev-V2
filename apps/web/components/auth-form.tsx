"use client";

import type { FormEvent } from "react";
import { startTransition, useDeferredValue, useState, useTransition } from "react";
import { ArrowRight, Send, ShieldCheck } from "lucide-react";

import { authEntryCopy } from "@yuwen/design-system";

type AuthMode = "password" | "code" | "magic-link";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("hello@yuwen.chat");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, beginTransition] = useTransition();
  const previewEmail = useDeferredValue(email);

  const modeMeta = authEntryCopy.find((entry) => entry.key === mode)!;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    beginTransition(() => {
      if (mode === "password") {
        setNotice(`已准备调用 /auth/login/password，目标邮箱为 ${previewEmail}。`);
        return;
      }

      if (mode === "code") {
        setNotice(
          code
            ? `已准备调用 /auth/login/confirm-code，验证码 ${code} 将在服务端做过期与次数校验。`
            : `已准备调用 /auth/login/request-code，验证码会发送到 ${previewEmail}。`
        );
        return;
      }

      setNotice(
        `已准备调用 /auth/login/request-magic-link，Magic Link 会发送到 ${previewEmail} 并跳转到 /auth/verify。`
      );
    });
  }

  function simulateRegistration() {
    startTransition(() => {
      setMode("code");
      setCode("");
      setNotice(
        "注册流程默认建议先发验证码；如果要无密码注册，也可以改走 Magic Link。"
      );
    });
  }

  return (
    <div className="stack">
      <div className="mode-switch">
        <button
          className={mode === "password" ? "active" : ""}
          onClick={() => setMode("password")}
          type="button"
        >
          密码
        </button>
        <button
          className={mode === "code" ? "active" : ""}
          onClick={() => setMode("code")}
          type="button"
        >
          验证码
        </button>
        <button
          className={mode === "magic-link" ? "active" : ""}
          onClick={() => setMode("magic-link")}
          type="button"
        >
          Magic Link
        </button>
      </div>

      <div className="surface panel">
        <div className="panel-body stack">
          <div>
            <p className="eyebrow">{modeMeta.title}</p>
            <p className="muted">{modeMeta.description}</p>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span className="label">邮箱</span>
              <input
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                type="email"
              />
            </label>

            {mode === "password" ? (
              <label className="field">
                <span className="label">密码</span>
                <input
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 位"
                  type="password"
                />
              </label>
            ) : null}

            {mode === "code" ? (
              <label className="field">
                <span className="label">验证码（留空则模拟发送）</span>
                <input
                  className="input mono"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
              </label>
            ) : null}

            <div className="button-row">
              <button className="primary-button" disabled={isPending} type="submit">
                {mode === "magic-link" ? (
                  <>
                    <Send size={16} />
                    发送 Magic Link
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    继续
                  </>
                )}
              </button>
              <button
                className="secondary-button"
                onClick={simulateRegistration}
                type="button"
              >
                切到注册建议路径
              </button>
            </div>
          </form>

          <div className="notice">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} />
              <strong>统一邮件认证策略</strong>
            </div>
            <div>
              注册与登录都可以使用验证码和 magic link；密码登录则继续作为稳定兜底。
            </div>
          </div>

          {notice ? <div className="notice">{notice}</div> : null}
        </div>
      </div>
    </div>
  );
}
