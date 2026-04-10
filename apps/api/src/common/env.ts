import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  WEB_APP_URL: z.string().url().default("http://localhost:3000"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  AUTH_CODE_TTL_MINUTES: z.coerce.number().default(10),
  MAGIC_LINK_TTL_MINUTES: z.coerce.number().default(15),
  FRIEND_CODE_LENGTH: z.coerce.number().default(8),
  MAIL_FROM_NAME: z.string().default("语闻"),
  MAIL_FROM_ADDRESS: z.string().email(),
  MAIL_REPLY_TO: z.string().email().optional(),
  MAIL_SMTP_HOST: z.string().min(1),
  MAIL_SMTP_PORT: z.coerce.number().default(465),
  MAIL_SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  MAIL_SMTP_USER: z.string().min(1),
  MAIL_SMTP_PASSWORD: z.string().min(1),
  ADMIN_EMAILS: z.string().optional()
});

const parsed = envSchema.parse(process.env);

function parseAdminEmails(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export const appEnv = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  webAppUrl: parsed.WEB_APP_URL,
  accessTokenTtlMinutes: parsed.ACCESS_TOKEN_TTL_MINUTES,
  refreshTokenTtlDays: parsed.REFRESH_TOKEN_TTL_DAYS,
  authCodeTtlMinutes: parsed.AUTH_CODE_TTL_MINUTES,
  magicLinkTtlMinutes: parsed.MAGIC_LINK_TTL_MINUTES,
  friendCodeLength: parsed.FRIEND_CODE_LENGTH,
  mailFromName: parsed.MAIL_FROM_NAME,
  mailFromAddress: parsed.MAIL_FROM_ADDRESS,
  mailReplyTo: parsed.MAIL_REPLY_TO,
  mailSmtpHost: parsed.MAIL_SMTP_HOST,
  mailSmtpPort: parsed.MAIL_SMTP_PORT,
  mailSmtpSecure: parsed.MAIL_SMTP_SECURE,
  mailSmtpUser: parsed.MAIL_SMTP_USER,
  mailSmtpPassword: parsed.MAIL_SMTP_PASSWORD,
  adminEmails: parseAdminEmails(parsed.ADMIN_EMAILS)
} as const;
