import { Module } from "@nestjs/common";

import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CommonModule } from "./common/common.module.js";
import { ConversationsModule } from "./conversations/conversations.module.js";
import { FriendsModule } from "./friends/friends.module.js";
import { MailModule } from "./mail/mail.module.js";
import { MessagesModule } from "./messages/messages.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    MailModule,
    RealtimeModule,
    AdminModule,
    AuthModule,
    UsersModule,
    FriendsModule,
    MessagesModule,
    ConversationsModule
  ]
})
export class AppModule {}
