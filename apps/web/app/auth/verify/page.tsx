"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "../../../components/brand-logo";
import { authApi, persistUserSession } from "../../../lib/api-client";

function getPurpose(
  value: string | null
): "login" | "register" {
  return value === "register" ? "register" : "login";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Magic Link 校验失败。";
}

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasConsumedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("正在校验 Magic Link，请稍候。");

  const purpose = getPurpose(searchParams.get("purpose"));
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (hasConsumedRef.current) {
      return;
    }

    hasConsumedRef.current = true;

    if (!email || !token) {
      setStatus("error");
      setMessage("Magic Link 缺少必要参数，请重新从邮箱打开完整链接。");
      return;
    }

    void (async () => {
      try {
        const session = await authApi.consumeMagicLink(purpose, email, token);
        persistUserSession(session);
        setStatus("success");
        setMessage(
          purpose === "register"
            ? "注册成功，正在进入设置页补密码。"
            : "登录成功，正在进入语闻。"
        );

        window.setTimeout(() => {
          router.replace(
            purpose === "register" ? "/settings?setup=password" : "/inbox"
          );
        }, 900);
      } catch (error) {
        setStatus("error");
        setMessage(getErrorMessage(error));
      }
    })();
  }, [email, purpose, router, token]);

  return (
    <main className="app-page">
      <div className="verify-wrap">
        <BrandLogo
          caption="Magic Link 承接页"
          className="verify-brand"
          priority
          size="md"
        />
        <section className="surface panel">
          <div className="panel-header">
            <p className="eyebrow">Magic Link Callback</p>
            <h1 className="section-title serif">
              {purpose === "register" ? "正在完成注册" : "正在完成登录"}
            </h1>
            <p className="muted">{message}</p>
          </div>
          <div className="panel-body stack">
            <div className="code-display">
              <div>
                <div className="label">Purpose</div>
                <strong>{purpose === "register" ? "注册" : "登录"}</strong>
              </div>
              <div>
                <div className="label">Email</div>
                <strong>{email || "未提供"}</strong>
              </div>
            </div>

            <div className="notice">
              {status === "loading"
                ? "语闻正在把 Magic Link token 提交给后端，一次性消费后会自动创建设备会话。"
                : status === "success"
                  ? "Magic Link 已消费成功，页面会自动跳转。"
                  : "如果链接已过期或被重复点击，请回到首页重新发送一封新邮件。"}
            </div>

            <div className="button-row">
              <Link className="secondary-button" href="/">
                返回登录入口
              </Link>
              <Link className="secondary-button" href="/settings">
                去设置页
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
