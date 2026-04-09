import type { AuthIntentPurpose } from "@yuwen/protocol";

export type SendAuthCodeInput = {
  email: string;
  code: string;
  purpose: AuthIntentPurpose;
  expiresInMinutes: number;
};

export type SendMagicLinkInput = {
  email: string;
  link: string;
  purpose: AuthIntentPurpose;
  expiresInMinutes: number;
};

export interface MailProvider {
  sendAuthCode(input: SendAuthCodeInput): Promise<void>;
  sendMagicLink(input: SendMagicLinkInput): Promise<void>;
}

export const MAIL_PROVIDER = Symbol("MAIL_PROVIDER");

