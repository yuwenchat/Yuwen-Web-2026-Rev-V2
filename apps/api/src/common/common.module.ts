import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { SessionGuard } from "./session.guard.js";

@Module({
  imports: [PrismaModule],
  providers: [SessionGuard],
  exports: [SessionGuard]
})
export class CommonModule {}

