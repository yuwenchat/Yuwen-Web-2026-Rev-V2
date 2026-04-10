import { SettingsPanel } from "../../components/settings-panel";
import { SiteHeader } from "../../components/site-header";

export default function SettingsPage() {
  return (
    <main className="app-page">
      <SiteHeader
        description="这里负责把长期身份、可轮换入口和真实安全表达拆开说明，让用户知道每一项设置究竟会影响什么。"
        eyebrow="Identity & Security"
        links={[
          { href: "/", label: "登录入口" },
          { href: "/onboarding", label: "Onboarding" },
          { href: "/inbox", label: "聊天界面" },
          { href: "/admin", label: "管理后台" }
        ]}
        title="账户、friend code 与安全说明"
      />

      <SettingsPanel />
    </main>
  );
}
