import type { SecurityMode } from "@yuwen/protocol";

export const theme = {
  colors: {
    ink: "#0d1c19",
    paper: "#f5f1e8",
    mist: "#dfe7df",
    moss: "#284c43",
    sea: "#7ec9b1",
    gold: "#d6b25e",
    rose: "#cc7b78"
  },
  radii: {
    pill: "999px",
    card: "28px",
    bubble: "24px"
  },
  shadows: {
    soft: "0 24px 80px rgba(13, 28, 25, 0.12)",
    edge: "0 1px 0 rgba(255, 255, 255, 0.4) inset"
  }
} as const;

export const securityModeCopy: Record<
  SecurityMode,
  { label: string; description: string }
> = {
  transport_protected: {
    label: "连接与传输受保护",
    description: "首发版本先确保链路安全、设备隔离和风险提示准确。"
  },
  e2ee_ready: {
    label: "已为端到端加密预留",
    description: "会话协议、设备模型和安全界面已经准备好接入 E2EE。"
  },
  e2ee_verified: {
    label: "端到端加密已验证",
    description: "设备安全指纹一致，聊天内容仅参与会话的设备可见。"
  }
};

export const messageStatusCopy = {
  sent: "已发送",
  read: "已读",
  edited: "已编辑",
  deleted: "已删除",
  incoming: ""
} as const;

export const authEntryCopy = [
  {
    key: "password",
    title: "密码登录",
    description: "保留稳定的账号入口，邮件链路异常时也能继续登录。"
  },
  {
    key: "code",
    title: "邮箱验证码",
    description: "适合快速注册、风险验证和临时免密登录。"
  },
  {
    key: "magic-link",
    title: "Magic Link",
    description: "单次有效、短时过期，点击邮件链接直接完成登录。"
  }
] as const;

export const productPrinciples = [
  "friend code 可手动轮换，泄露后立刻失效。",
  "删除支持仅自己或给双方，不做撤回倒计时。",
  "安全文案宁愿克制，也不提前夸大 E2EE 能力。"
] as const;

