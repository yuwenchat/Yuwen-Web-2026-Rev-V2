import Link from "next/link";

import { SettingsPanel } from "../../components/settings-panel";

export default function SettingsPage() {
  return (
    <main className="app-page">
      <div className="top-nav">
        <div>
          <p className="eyebrow">Identity & Security</p>
          <h1 className="section-title serif">账户、friend code 与安全说明</h1>
        </div>
        <nav className="nav-links">
          <Link href="/">登录入口</Link>
          <Link href="/inbox">聊天界面</Link>
        </nav>
      </div>

      <SettingsPanel />
    </main>
  );
}

