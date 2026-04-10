import Link from "next/link";

import { BrandLogo } from "./brand-logo";

const userSteps = [
  {
    step: "01",
    title: "先确认邮箱身份",
    body: "密码、验证码和 Magic Link 都从同一个邮箱入口开始，第一步就让用户知道自己在做登录还是注册。"
  },
  {
    step: "02",
    title: "再建立自己的可见身份",
    body: "显示名称、@handle 和 friend code 拆开处理。长期身份交给语闻号，临时入口交给可手动刷新的 friend code。"
  },
  {
    step: "03",
    title: "最后才进入聊天",
    body: "进入会话前先讲清楚已读、正在输入、编辑、删除和安全状态，减少误解，也减少产品需要补救的地方。"
  }
];

const adminSteps = [
  {
    step: "A1",
    title: "先把邮箱写进 ADMIN_EMAILS",
    body: "后台权限跟账号角色绑定，而不是单独的后台口令。只有配置在环境变量里的邮箱才能自动拿到 ADMIN。"
  },
  {
    step: "A2",
    title: "用同一套账号体系完成注册",
    body: "管理员也走正常用户流程注册。若第一次用验证码或 Magic Link 进来，再补一个密码，方便之后直接登录后台。"
  },
  {
    step: "A3",
    title: "再进入 /admin",
    body: "后台只接受 ADMIN 角色账号。普通用户即使登录成功，也会被后端挡在管理接口之外。"
  }
];

const trustNotes = [
  "首发版只会展示“连接与传输受保护”，不会提前冒用端到端加密。",
  "Emoji 指纹在 v1 是可视化预留位，等 E2EE 真正接入后再绑定真实会话指纹。",
  "消息支持长期编辑、仅自己删除和给双方删除，但不会把这套语义说成“撤回”。"
];

export function OnboardingExperience() {
  return (
    <section className="onboarding-layout">
      <section className="onboarding-hero">
        <div className="onboarding-copy">
          <BrandLogo
            caption="把信任感留在第一分钟"
            priority
            size="lg"
          />
          <p className="eyebrow">First Run</p>
          <h2 className="section-title serif onboarding-title">
            把 onboarding 做成一段安静、清楚、可信的进入过程。
          </h2>
          <p className="muted onboarding-lead">
            新用户不需要一口气理解所有功能。语闻的第一分钟应该先帮他们确认身份、认出自己的对外名片，再看懂聊天里的状态和安全边界。
          </p>
          <div className="button-row">
            <Link className="primary-button" href="/">
              回到统一登录入口
            </Link>
            <Link className="secondary-button" href="/inbox">
              直接看聊天界面
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="onboarding-orbit">
          <div className="ambient-wave ambient-wave-a" />
          <div className="ambient-wave ambient-wave-b" />
          <article className="flow-card flow-card-primary">
            <span className="flow-card-kicker">Account</span>
            <strong>邮箱入口统一，但状态分明。</strong>
            <p>登录、注册、验证码和 Magic Link 共用一条路，不让用户猜自己现在在哪一步。</p>
          </article>
          <article className="flow-card flow-card-secondary">
            <span className="flow-card-kicker">Identity</span>
            <strong>@handle 稳定，friend code 可刷新。</strong>
            <p>降低骚扰面，也保留主动建立联系的低摩擦体验。</p>
          </article>
          <article className="flow-card flow-card-tertiary">
            <span className="flow-card-kicker">Trust</span>
            <strong>安全文案只说已经真实具备的能力。</strong>
            <p>把“encrypted-ready”与“已经 E2EE”明确分开，界面先建立可信度。</p>
          </article>
        </div>
      </section>

      <section className="surface onboarding-section">
        <div className="onboarding-section-head">
          <div>
            <p className="eyebrow">User Flow</p>
            <h3 className="section-title serif">新用户 onboarding 只做三件事。</h3>
          </div>
          <p className="muted onboarding-section-copy">
            每个阶段只给一个主要任务，避免第一次打开时就堆满设置项和解释。
          </p>
        </div>
        <div className="onboarding-grid">
          {userSteps.map((item) => (
            <article className="onboarding-card" key={item.step}>
              <span className="step-badge">{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="onboarding-dual">
        <section className="surface onboarding-section">
          <div className="onboarding-section-head">
            <div>
              <p className="eyebrow">Admin First Run</p>
              <h3 className="section-title serif">管理员后台也需要自己的 onboarding。</h3>
            </div>
            <p className="muted onboarding-section-copy">
              后台第一次进入最怕的是权限和登录方式不清楚，所以这里直接把角色来源讲清楚。
            </p>
          </div>
          <div className="onboarding-grid compact">
            {adminSteps.map((item) => (
              <article className="onboarding-card compact" key={item.step}>
                <span className="step-badge">{item.step}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <div className="button-row">
            <Link className="secondary-button" href="/admin">
              打开管理后台
            </Link>
            <Link className="ghost-button" href="/settings">
              先看账户与安全设置
            </Link>
          </div>
        </section>

        <section className="surface onboarding-section">
          <div className="onboarding-section-head">
            <div>
              <p className="eyebrow">Trust Language</p>
              <h3 className="section-title serif">引导里提前说明三条边界。</h3>
            </div>
          </div>
          <ul className="utility-list">
            {trustNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>
    </section>
  );
}
