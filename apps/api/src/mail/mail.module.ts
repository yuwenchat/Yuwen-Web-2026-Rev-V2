import { Module } from "@nestjs/common";

import { FeishuSmtpProvider } from "./feishu-smtp.provider.js";
import { MAIL_PROVIDER } from "./mail.provider.js";

@Module({
  providers: [
    FeishuSmtpProvider,
    {
      provide: MAIL_PROVIDER,
      useExisting: FeishuSmtpProvider
    }
  ],
  exports: [MAIL_PROVIDER]
})
export class MailModule {}

