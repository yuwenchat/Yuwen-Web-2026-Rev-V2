import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { RealtimeGateway } from "./realtime.gateway.js";

@Module({
  imports: [PrismaModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway]
})
export class RealtimeModule {}

