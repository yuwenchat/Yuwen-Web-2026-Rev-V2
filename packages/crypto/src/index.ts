import type { SecurityMode } from "@yuwen/protocol";

export type DeviceKeyBundle = {
  identityKey: string;
  signedPreKey: string;
  oneTimePreKeys: string[];
};

export interface E2EEAdapter {
  createDeviceBundle(deviceId: string): Promise<DeviceKeyBundle>;
  exportEmojiFingerprint(conversationId: string): Promise<string[]>;
  encryptMessage(plaintext: string, conversationId: string): Promise<string>;
  decryptMessage(ciphertext: string, conversationId: string): Promise<string>;
}

const emojiDeck = [
  "🪴",
  "🌊",
  "🫖",
  "🧭",
  "🪐",
  "🌾",
  "🕯️",
  "🍃",
  "🪵",
  "🌙",
  "🫧",
  "🧩",
  "🛰️",
  "🎐",
  "🪞",
  "☁️"
] as const;

function xmur3(input: string) {
  let hash = 1779033703 ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return function nextSeed() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function nextRandom() {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;

    const sum = (a + b + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = ((c << 21) | (c >>> 11)) | 0;
    c = (c + sum) | 0;

    return (sum >>> 0) / 4294967296;
  };
}

export function emojiFingerprintFromSeed(seed: string, count = 6): string[] {
  // 首发阶段这里只做“可重复的视觉占位”，不能把它视为真实密钥指纹。
  const seedFactory = xmur3(seed);
  const random = sfc32(
    seedFactory(),
    seedFactory(),
    seedFactory(),
    seedFactory()
  );
  const fingerprint: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const emojiIndex = Math.floor(random() * emojiDeck.length);
    fingerprint.push(emojiDeck[emojiIndex] ?? emojiDeck[0]);
  }

  return fingerprint;
}

export function securityModeSummary(mode: SecurityMode): string {
  switch (mode) {
    case "transport_protected":
      return "当前会话已启用传输保护，但还没有打开端到端加密。";
    case "e2ee_ready":
      return "协议和设备模型已准备好接入 E2EE，后续可直接升级。";
    case "e2ee_verified":
      return "会话已经过设备指纹验证，消息内容仅终端持有密钥。";
    default:
      return "安全状态未知。";
  }
}

export const e2eeRoadmap = [
  "为每台设备生成独立身份密钥和恢复流程。",
  "将消息 payload 从明文切换为可协商的 ciphertext。",
  "在会话详情页展示 emoji 安全指纹和验证历史。"
] as const;
