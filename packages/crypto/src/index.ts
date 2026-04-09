import { createHash } from "node:crypto";

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

export function emojiFingerprintFromSeed(seed: string, count = 6): string[] {
  const digest = createHash("sha256").update(seed).digest();
  const fingerprint: string[] = [];

  for (let index = 0; index < count; index += 1) {
    fingerprint.push(emojiDeck[digest[index] % emojiDeck.length]);
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
