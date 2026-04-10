import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { friendRequestCreateSchema } from "@yuwen/protocol";

import { CurrentAuth, type RequestAuth } from "../common/current-auth.js";
import { SessionGuard } from "../common/session.guard.js";
import { parseSchema } from "../common/zod.js";
import { FriendsService } from "./friends.service.js";

@UseGuards(SessionGuard)
@Controller("friends")
export class FriendsController {
  constructor(@Inject(FriendsService) private readonly friendsService: FriendsService) {}

  @Post("request")
  async requestFriend(
    @CurrentAuth() auth: RequestAuth,
    @Body() body: unknown
  ) {
    const input = parseSchema(friendRequestCreateSchema, body);
    return this.friendsService.requestFriend(auth.userId, input.identifier);
  }

  @Post("request/:id/accept")
  async acceptFriendRequest(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") friendRequestId: string
  ) {
    return this.friendsService.acceptFriendRequest(auth.userId, friendRequestId);
  }

  @Get()
  async listFriends(@CurrentAuth() auth: RequestAuth) {
    return this.friendsService.listFriends(auth.userId);
  }
}
