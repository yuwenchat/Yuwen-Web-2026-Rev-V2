import { Module } from "@nestjs/common";

import { CommonModule } from "../common/common.module.js";
import { MessagesModule } from "../messages/messages.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ConversationsController } from "./conversations.controller.js";
import { ConversationsService } from "./conversations.service.js";

@Module({
  imports: [PrismaModule, MessagesModule, CommonModule],
  controllers: [ConversationsController],
  providers: [ConversationsService]
})
export class ConversationsModule {}

