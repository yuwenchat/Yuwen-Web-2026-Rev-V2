import Link from "next/link";

import { productPrinciples } from "@yuwen/design-system";

import { AuthForm } from "../components/auth-form";
import { BrandLogo } from "../components/brand-logo";

export default function HomePage() {
  return (
    <main className="app-page">
      <div className="landing">
        <section className="poster">
          <div className="poster-top">
            <BrandLogo
              caption="安静、可信的网页对话"
              priority
              size="md"
            />
          </div>

          <div className="poster-middle">
            <p className="eyebrow">Private Conversations, Web First</p>
            <h1 className="poster-title">让第一分钟先建立信任。</h1>
            <p className="poster-copy">
              语闻把邮箱身份、friend code、正在输入、已读和多设备协同准备放进同一套克制的界面里。
              首发版本先把 onboarding、聊天流畅度、消息编辑删除和真实安全表达做扎实，再平滑接入端到端加密。
            </p>

            <div aria-hidden="true" className="poster-stage">
              <div className="poster-glow poster-glow-a" />
              <div className="poster-glow poster-glow-b" />
              <div className="poster-preview">
                <div className="poster-preview-header">
                  <span>Onboarding</span>
                  <span>Encrypted-ready</span>
                </div>
                <div className="poster-preview-line long" />
                <div className="poster-preview-line short" />
                <div className="poster-preview-pill-row">
                  <span className="security-pill">邮箱身份</span>
                  <span className="status-pill">friend code</span>
                </div>
              </div>
            </div>

            <div className="poster-grid">
              <div className="poster-chip">
                <strong>邮箱验证码 + Magic Link</strong>
                <span>保留密码入口，同时支持更轻的免密登录体验。</span>
              </div>
              <div className="poster-chip">
                <strong>新用户 onboarding</strong>
                <span>先认清身份与安全状态，再进入聊天，而不是一上来堆满功能。</span>
              </div>
              <div className="poster-chip">
                <strong>friend code 可刷新</strong>
                <span>泄露后由用户主动换码，旧码立即失效，降低骚扰面。</span>
              </div>
              <div className="poster-chip">
                <strong>编辑与双向删除</strong>
                <span>像 Telegram 一样长期管理消息，不依赖撤回倒计时。</span>
              </div>
            </div>
          </div>

          <div className="poster-bottom">
            <div className="poster-footer">
              <p className="poster-note">
                安全文案会严格对应真实能力。首发阶段只显示“连接与传输受保护”，不会提前冒用
                “端到端加密已开启”的措辞。
              </p>
              <div className="button-row">
                <Link className="primary-button" href="/onboarding">
                  查看 onboarding
                </Link>
                <Link className="primary-button" href="/inbox">
                  查看聊天主界面
                </Link>
                <Link className="secondary-button" href="/settings">
                  查看账户与安全设置
                </Link>
                <Link className="secondary-button" href="/admin">
                  查看管理后台
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div>
            <p className="eyebrow">Unified Entry</p>
            <h2 className="section-title serif">把三种登录方式收进一个入口。</h2>
            <p className="muted">
              先输入邮箱，再按场景选择密码、验证码或 magic link。界面会优先把“你现在正在做什么”
              讲清楚，而不是让用户猜状态。
            </p>
          </div>

          <AuthForm />

          <div className="stack">
            <p className="eyebrow">产品原则</p>
            <ul className="utility-list">
              {productPrinciples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="notice">
              新增的 onboarding 会把新用户路径和管理员第一次进入后台的路径分开讲清楚，减少首次使用时的迷失感。
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
