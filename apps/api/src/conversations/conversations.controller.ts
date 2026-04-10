import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import {
  conversationReadSchema,
  messageCreateSchema,
  messageUpdateSchema
} from "@yuwen/protocol";

import { CurrentAuth, type RequestAuth } from "../common/current-auth.js";
import { SessionGuard } from "../common/session.guard.js";
import { parseSchema } from "../common/zod.js";
import { MessagesService } from "../messages/messages.service.js";
import { ConversationsService } from "./conversations.service.js";

@UseGuards(SessionGuard)
@Controller("conversations")
export class ConversationsController {
  constructor(
    @Inject(ConversationsService)
    private readonly conversationsService: ConversationsService,
    @Inject(MessagesService)
    private readonly messagesService: MessagesService
  ) {}

  @Get()
  async listConversations(@CurrentAuth() auth: RequestAuth) {
    return this.conversationsService.listConversations(auth.userId);
  }

  @Get(":id/messages")
  async listMessages(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string
  ) {
    return this.messagesService.listMessages(auth.userId, conversationId);
  }

  @Post(":id/messages")
  async sendMessage(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string,
    @Body() body: unknown
  ) {
    const input = parseSchema(messageCreateSchema, body);
    return this.messagesService.sendMessage(auth, conversationId, input);
  }

  @Patch(":id/messages/:messageId")
  async editMessage(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string,
    @Param("messageId") messageId: string,
    @Body() body: unknown
  ) {
    const input = parseSchema(messageUpdateSchema, body);
    return this.messagesService.editMessage(
      auth,
      conversationId,
      messageId,
      input.payload.text
    );
  }

  @Post(":id/messages/:messageId/delete-for-self")
  async deleteForSelf(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string,
    @Param("messageId") messageId: string
  ) {
    return this.messagesService.deleteForSelf(auth, conversationId, messageId);
  }

  @Post(":id/messages/:messageId/delete-for-everyone")
  async deleteForEveryone(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string,
    @Param("messageId") messageId: string
  ) {
    return this.messagesService.deleteForEveryone(auth, conversationId, messageId);
  }

  @Post(":id/read")
  async markRead(
    @CurrentAuth() auth: RequestAuth,
    @Param("id") conversationId: string,
    @Body() body: unknown
  ) {
    const input = parseSchema(conversationReadSchema, body);
    return this.messagesService.markRead(
      auth,
      conversationId,
      input.lastReadMessageId
    );
  }
}
