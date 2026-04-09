import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { MessagesService } from "./messages.service.js";

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}

