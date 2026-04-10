import { InboxDemo } from "../../components/inbox-demo";
import { SiteHeader } from "../../components/site-header";

export default function InboxPage() {
  return (
    <main className="app-page">
      <SiteHeader
        description="把已读、正在输入、编辑、删除和安全状态都收在一个更冷静的工作界面里。"
        eyebrow="Workspace Demo"
        links={[
          { href: "/", label: "登录入口" },
          { href: "/onboarding", label: "Onboarding" },
          { href: "/settings", label: "账户设置" },
          { href: "/admin", label: "管理后台" }
        ]}
        title="语闻聊天主界面"
      />

      <InboxDemo />
    </main>
  );
}
