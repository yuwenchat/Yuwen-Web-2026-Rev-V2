import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import {
  clientSocketEventNames,
  serverSocketEventNames
} from "@yuwen/protocol";
import type { Server, Socket } from "socket.io";

import { PrismaService } from "../prisma/prisma.service.js";
import { hashValue } from "../common/security.js";

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket): Promise<void> {
    const handshakeToken =
      typeof client.handshake.auth.token === "string"
        ? client.handshake.auth.token
        : typeof client.handshake.headers.authorization === "string"
          ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
          : "";

    if (!handshakeToken) {
      client.disconnect();
      return;
    }

    const session = await this.prisma.deviceSession.findUnique({
      where: {
        accessTokenHash: hashValue(handshakeToken)
      }
    });

    if (!session || session.expiresAt < new Date()) {
      client.disconnect();
      return;
    }

    client.data.auth = {
      userId: session.userId,
      deviceId: session.deviceId
    };

    await client.join(`user:${session.userId}`);
    this.server.to(`user:${session.userId}`).emit(serverSocketEventNames.sessionReady, {
      userId: session.userId,
      deviceId: session.deviceId
    });
  }

  @SubscribeMessage(clientSocketEventNames.subscribeConversation)
  async handleConversationSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string }
  ): Promise<{ ok: true }> {
    await client.join(`conversation:${body.conversationId}`);
    return {
      ok: true
    };
  }

  @SubscribeMessage(clientSocketEventNames.typingSet)
  async handleTypingSet(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      conversationId: string;
      isTyping: boolean;
    }
  ): Promise<{ ok: true }> {
    const auth = client.data.auth as { userId: string } | undefined;

    if (!auth) {
      client.disconnect();
      return {
        ok: true
      };
    }

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId: body.conversationId
      }
    });
    const userIds = participants.map((participant) => participant.userId);
    const event = body.isTyping
      ? serverSocketEventNames.typingStarted
      : serverSocketEventNames.typingStopped;

    this.emitToUsers(userIds, event, {
      conversationId: body.conversationId,
      typingUserIds: body.isTyping ? [auth.userId] : []
    });

    return {
      ok: true
    };
  }

  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    for (const userId of new Set(userIds)) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }
}

