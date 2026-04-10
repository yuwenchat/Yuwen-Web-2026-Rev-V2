import { AdminDashboard } from "../../components/admin-dashboard";
import { SiteHeader } from "../../components/site-header";

export default function AdminPage() {
  return (
    <main className="app-page">
      <SiteHeader
        description="后台现在跟普通账号体系共用登录，但只有后端角色为 ADMIN 的账号才会被放行。"
        eyebrow="Admin Console"
        links={[
          { href: "/", label: "登录入口" },
          { href: "/onboarding", label: "Onboarding" },
          { href: "/inbox", label: "聊天界面" },
          { href: "/settings", label: "账户设置" }
        ]}
        title="语闻管理后台"
      />

      <AdminDashboard />
    </main>
  );
}
