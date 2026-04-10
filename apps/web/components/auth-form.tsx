"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState, useTransition } from "react";
import { ArrowRight, Send, ShieldCheck } from "lucide-react";

import { authEntryCopy } from "@yuwen/design-system";

import { authApi, persistUserSession } from "../lib/api-client";

type AuthMode = "password" | "code" | "magic-link";
type AuthIntent = "login" | "register";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求失败，请稍后再试。";
}

export function AuthForm() {
  const router = useRouter();
  const [intent, setIntent] = useState<AuthIntent>("login");
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("hello@yuwen.chat");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, beginTransition] = useTransition();
  const previewEmail = useDeferredValue(email);

  useEffect(() => {
    if (intent === "register" && mode === "password") {
      setMode("code");
    }
  }, [intent, mode]);

  const modeMeta = authEntryCopy.find((entry) => entry.key === mode)!;
  const visibleModes =
    intent === "register"
      ? authEntryCopy.filter((entry) => entry.key !== "password")
      : authEntryCopy;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = previewEmail.trim().toLowerCase();

    if (!nextEmail) {
      setNotice("请先输入邮箱。");
      return;
    }

    beginTransition(() => {
      void (async () => {
        try {
          setNotice(null);

          if (mode === "password") {
            if (!password.trim()) {
              setNotice("请输入密码。");
              return;
            }

            const session = await authApi.loginWithPassword(nextEmail, password);
            persistUserSession(session);
            setPassword("");
            setNotice("登录成功，正在进入语闻。");
            router.push("/inbox");
            return;
          }

          if (mode === "code") {
            if (code.trim()) {
              const session =
                intent === "register"
                  ? await authApi.confirmRegisterCode(nextEmail, code.trim())
                  : await authApi.confirmLoginCode(nextEmail, code.trim());

              persistUserSession(session);
              setCode("");
              setNotice(
                intent === "register"
                  ? "注册完成，正在进入设置页补密码。"
                  : "验证成功，正在进入语闻。"
              );
              router.push(
                intent === "register" ? "/settings?setup=password" : "/inbox"
              );
              return;
            }

            const result =
              intent === "register"
                ? await authApi.requestRegisterCode(nextEmail)
                : await authApi.requestLoginCode(nextEmail);

            setNotice(
              `${intent === "register" ? "注册" : "登录"}验证码已发送到 ${nextEmail}，有效期至 ${new Date(
                result.expiresAt
              ).toLocaleString("zh-CN")}`
            );
            return;
          }

          const result =
            intent === "register"
              ? await authApi.requestRegisterMagicLink(nextEmail)
              : await authApi.requestLoginMagicLink(nextEmail);

          setNotice(
            `${intent === "register" ? "注册" : "登录"} Magic Link 已发送到 ${nextEmail}，有效期至 ${new Date(
              result.expiresAt
            ).toLocaleString("zh-CN")}。请去邮箱点击链接。`
          );
        } catch (error) {
          setNotice(getErrorMessage(error));
        }
      })();
    });
  }

  function toggleIntent(nextIntent: AuthIntent) {
    startTransition(() => {
      setIntent(nextIntent);
      setCode("");
      setPassword("");
      setNotice(
        nextIntent === "register"
          ? "注册建议先走验证码或 Magic Link。完成后会引导你立刻补一个密码。"
          : "登录可以使用密码、验证码或 Magic Link。"
      );
    });
  }

  const submitLabel =
    mode === "password"
      ? "登录"
      : mode === "magic-link"
        ? "发送 Magic Link"
        : code.trim()
          ? intent === "register"
            ? "验证并注册"
            : "验证并登录"
          : "发送验证码";

  return (
    <div className="stack">
      <div className="mode-switch" role="tablist" aria-label="认证意图">
        <button
          className={intent === "login" ? "active" : ""}
          onClick={() => toggleIntent("login")}
          type="button"
        >
          登录
        </button>
        <button
          className={intent === "register" ? "active" : ""}
          onClick={() => toggleIntent("register")}
          type="button"
        >
          注册
        </button>
      </div>

      <div className="mode-switch" role="tablist" aria-label="认证方式">
        {visibleModes.map((entry) => (
          <button
            className={mode === entry.key ? "active" : ""}
            key={entry.key}
            onClick={() => setMode(entry.key)}
            type="button"
          >
            {entry.key === "magic-link" ? "Magic Link" : entry.title.replace("登录", "")}
          </button>
        ))}
      </div>

      <div className="surface panel">
        <div className="panel-body stack">
          <div>
            <p className="eyebrow">
              {intent === "register" ? "Register Flow" : "Login Flow"}
            </p>
            <p className="muted">
              {intent === "register"
                ? "先完成邮箱验证，再补一个密码作为长期兜底。"
                : modeMeta.description}
            </p>
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
                <span className="label">
                  验证码{intent === "register" ? "（收到后填入完成注册）" : "（收到后填入完成登录）"}
                </span>
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
                    {submitLabel}
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    {submitLabel}
                  </>
                )}
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  toggleIntent(intent === "login" ? "register" : "login")
                }
                type="button"
              >
                {intent === "login" ? "切到注册路径" : "切回登录路径"}
              </button>
            </div>
          </form>

          <div className="notice">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} />
              <strong>统一邮件认证策略</strong>
            </div>
            <div>
              注册与登录都可以使用验证码和 Magic Link；注册完成后建议马上到设置页补一个密码。
            </div>
          </div>

          {notice ? <div className="notice">{notice}</div> : null}
        </div>
      </div>
    </div>
  );
}
