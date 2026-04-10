import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { adminListQuerySchema } from "@yuwen/protocol";

import { SessionGuard } from "../common/session.guard.js";
import { parseSchema } from "../common/zod.js";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";

@UseGuards(SessionGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get("overview")
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get("users")
  async listUsers(@Query() query: unknown) {
    const input = parseSchema(adminListQuerySchema, query);
    return this.adminService.listUsers(input);
  }

  @Get("conversations")
  async listConversations(@Query() query: unknown) {
    const input = parseSchema(adminListQuerySchema, query);
    return this.adminService.listConversations(input);
  }

  @Get("conversations/:id/messages")
  async listConversationMessages(@Param("id") conversationId: string) {
    return this.adminService.listConversationMessages(conversationId);
  }

  @Get("auth-intents")
  async listAuthIntents(@Query() query: unknown) {
    const input = parseSchema(adminListQuerySchema, query);
    return this.adminService.listAuthIntents(input);
  }

  @Get("friend-code-rotations")
  async listFriendCodeRotations(@Query() query: unknown) {
    const input = parseSchema(adminListQuerySchema, query);
    return this.adminService.listFriendCodeRotations(input);
  }
}
