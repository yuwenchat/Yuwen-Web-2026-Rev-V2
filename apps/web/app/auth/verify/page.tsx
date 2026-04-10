import Link from "next/link";

import { BrandLogo } from "../../../components/brand-logo";

type VerifyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = await searchParams;
  const purpose =
    typeof resolvedSearchParams?.purpose === "string"
      ? resolvedSearchParams.purpose
      : "login";
  const email =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "you@example.com";
  const token =
    typeof resolvedSearchParams?.token === "string"
      ? resolvedSearchParams.token
      : "demo-token";
  const endpoint =
    purpose === "register"
      ? "/auth/register/consume-magic-link"
      : "/auth/login/consume-magic-link";

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
              这个页面负责承接 Magic Link 的一次性登录。
            </h1>
            <p className="muted">
              实际接通 API 后，这里会将 token、email 和 purpose 发送到后端消费接口，成功后创建设备会话并跳转到收件箱。
            </p>
          </div>
          <div className="panel-body stack">
            <div className="code-display">
              <div>
                <div className="label">Purpose</div>
                <strong>{purpose === "register" ? "注册" : "登录"}</strong>
              </div>
              <div>
                <div className="label">Email</div>
                <strong>{email}</strong>
              </div>
            </div>

            <div className="key-value">
              <span className="label">将调用的后端接口</span>
              <strong className="mono">{endpoint}</strong>
              <span className="muted mono">{token}</span>
            </div>

            <div className="button-row">
              <Link className="primary-button" href="/inbox">
                模拟进入语闻
              </Link>
              <Link className="secondary-button" href="/">
                返回登录入口
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
