import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

const friendCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomToken(size = 32): string {
  return randomBytes(size).toString("base64url");
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomNumericCode(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10).toString()).join("");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

export function createFriendCode(length = 8): string {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * friendCodeAlphabet.length);
    return friendCodeAlphabet[index];
  }).join("");
}

export function createDirectPairKey(firstUserId: string, secondUserId: string): string {
  return [firstUserId, secondUserId].sort().join(":");
}

export function inferHandleBase(email: string): string {
  const localPart = email.split("@")[0] ?? "yuwen";
  const collapsed = localPart.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return collapsed.slice(0, 18) || "yuwen";
}

