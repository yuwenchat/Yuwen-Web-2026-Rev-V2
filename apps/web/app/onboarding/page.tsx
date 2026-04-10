import { OnboardingExperience } from "../../components/onboarding-experience";
import { SiteHeader } from "../../components/site-header";

export default function OnboardingPage() {
  return (
    <main className="app-page">
      <SiteHeader
        description="把新用户和管理员第一次进入产品时最容易迷路的地方，收拢成一段更轻、更可信的引导。"
        eyebrow="Onboarding"
        links={[
          { href: "/", label: "登录入口" },
          { href: "/inbox", label: "聊天界面" },
          { href: "/settings", label: "账户设置" },
          { href: "/admin", label: "管理后台" }
        ]}
        title="语闻 onboarding 体验"
      />

      <OnboardingExperience />
    </main>
  );
}
