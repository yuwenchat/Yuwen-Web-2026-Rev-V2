import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { updateProfileSchema } from "@yuwen/protocol";

import { CurrentAuth, type RequestAuth } from "../common/current-auth.js";
import { getRequestMeta } from "../common/http.js";
import { SessionGuard } from "../common/session.guard.js";
import { parseSchema } from "../common/zod.js";
import { UsersService } from "./users.service.js";

@UseGuards(SessionGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async me(@CurrentAuth() auth: RequestAuth) {
    return this.usersService.getMe(auth.userId);
  }

  @Patch("me/profile")
  async updateProfile(
    @CurrentAuth() auth: RequestAuth,
    @Body() body: unknown
  ) {
    const input = parseSchema(updateProfileSchema, body);
    return this.usersService.updateProfile(auth.userId, input);
  }

  @Post("me/friend-code/rotate")
  async rotateFriendCode(@CurrentAuth() auth: RequestAuth, @Req() request: any) {
    return this.usersService.rotateFriendCode(auth.userId, getRequestMeta(request));
  }
}

