import { Injectable } from "@nestjs/common";
// nodemailer 在当前部署环境里没有额外类型包，这里直接按运行时模块使用。
// @ts-ignore
import nodemailer from "nodemailer";

import { appEnv } from "../common/env.js";
import type {
  MailProvider,
  SendAuthCodeInput,
  SendMagicLinkInput
} from "./mail.provider.js";

@Injectable()
export class FeishuSmtpProvider implements MailProvider {
  private readonly transporter = nodemailer.createTransport({
    host: appEnv.mailSmtpHost,
    port: appEnv.mailSmtpPort,
    secure: appEnv.mailSmtpSecure,
    auth: {
      user: appEnv.mailSmtpUser,
      pass: appEnv.mailSmtpPassword
    }
  });

  async sendAuthCode(input: SendAuthCodeInput): Promise<void> {
    await this.transporter.sendMail({
      from: `"${appEnv.mailFromName}" <${appEnv.mailFromAddress}>`,
      to: input.email,
      replyTo: appEnv.mailReplyTo,
      subject:
        input.purpose === "register"
          ? "语闻注册验证码"
          : "语闻登录验证码",
      text: `你的语闻验证码是 ${input.code}，${input.expiresInMinutes} 分钟内有效。`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #10231d;">
          <h2>语闻验证码</h2>
          <p>你的${input.purpose === "register" ? "注册" : "登录"}验证码：</p>
          <p style="font-size: 28px; letter-spacing: 0.24em; font-weight: 700;">${input.code}</p>
          <p>${input.expiresInMinutes} 分钟内有效，请勿转发给他人。</p>
        </div>
      `
    });
  }

  async sendMagicLink(input: SendMagicLinkInput): Promise<void> {
    await this.transporter.sendMail({
      from: `"${appEnv.mailFromName}" <${appEnv.mailFromAddress}>`,
      to: input.email,
      replyTo: appEnv.mailReplyTo,
      subject:
        input.purpose === "register"
          ? "语闻注册 Magic Link"
          : "语闻登录 Magic Link",
      text: `点击链接完成${input.purpose === "register" ? "注册" : "登录"}：${input.link}。该链接 ${input.expiresInMinutes} 分钟内有效。`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #10231d;">
          <h2>语闻 Magic Link</h2>
          <p>点击下面的按钮完成${input.purpose === "register" ? "注册" : "登录"}。</p>
          <p>
            <a href="${input.link}" style="display: inline-block; padding: 14px 20px; border-radius: 999px; background: #18332d; color: #f5f1e8; text-decoration: none;">
              打开语闻
            </a>
          </p>
          <p>链接 ${input.expiresInMinutes} 分钟内有效，且仅可使用一次。</p>
        </div>
      `
    });
  }
}
