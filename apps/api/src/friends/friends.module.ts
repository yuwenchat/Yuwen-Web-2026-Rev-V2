import { Module } from "@nestjs/common";

import { CommonModule } from "../common/common.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { FriendsController } from "./friends.controller.js";
import { FriendsService } from "./friends.service.js";

@Module({
  imports: [PrismaModule, CommonModule, RealtimeModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}

