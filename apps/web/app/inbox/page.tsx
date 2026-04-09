import Link from "next/link";

import { InboxDemo } from "../../components/inbox-demo";

export default function InboxPage() {
  return (
    <main className="app-page">
      <div className="top-nav">
        <div>
          <p className="eyebrow">Workspace Demo</p>
          <h1 className="section-title serif">语闻聊天主界面</h1>
        </div>
        <nav className="nav-links">
          <Link href="/">登录入口</Link>
          <Link href="/settings">账户设置</Link>
        </nav>
      </div>

      <InboxDemo />
    </main>
  );
}

