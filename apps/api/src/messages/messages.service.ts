import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { RequestAuth } from "../common/current-auth.js";
import { toProtocolMessage, toProtocolReadState } from "../common/mappers.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { serverSocketEventNames } from "@yuwen/protocol";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async listMessages(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);

    const [messages, hiddenEntries] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId
        },
        orderBy: {
          sentAt: "asc"
        }
      }),
      this.prisma.messageVisibility.findMany({
        where: {
          userId,
          message: {
            is: {
              conversationId
            }
          }
        }
      })
    ]);

    const hiddenIds = new Set(hiddenEntries.map((entry) => entry.messageId));
    return messages
      .filter((message) => !hiddenIds.has(message.id))
      .map((message) => toProtocolMessage(message));
  }

  async sendMessage(
    auth: RequestAuth,
    conversationId: string,
    input: {
      payload: {
        text: string;
      };
      payloadFormat: "plain_text";
    }
  ) {
    await this.assertParticipant(auth.userId, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId: auth.userId,
        senderDeviceId: auth.deviceId,
        payload: input.payload,
        payloadFormat: "PLAIN_TEXT",
        encryptionState: "TRANSPORT_ENCRYPTED"
      }
    });

    await this.prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        lastMessageId: message.id
      }
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId
      }
    });
    const payload = toProtocolMessage(message);

    this.realtimeGateway.emitToUsers(
      participants.map((participant) => participant.userId),
      serverSocketEventNames.messageCreated,
      payload
    );

    return payload;
  }

  async editMessage(
    auth: RequestAuth,
    conversationId: string,
    messageId: string,
    text: string
  ) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId
      }
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Message not found.");
    }

    if (message.senderUserId !== auth.userId) {
      throw new ForbiddenException("Only the sender can edit this message.");
    }

    if (message.deletedForEveryoneAt) {
      throw new BadRequestException("Deleted messages cannot be edited.");
    }

    const updatedMessage = await this.prisma.message.update({
      where: {
        id: messageId
      },
      data: {
        payload: {
          text
        },
        editedAt: new Date()
      }
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId
      }
    });
    const payload = toProtocolMessage(updatedMessage);

    this.realtimeGateway.emitToUsers(
      participants.map((participant) => participant.userId),
      serverSocketEventNames.messageUpdated,
      payload
    );

    return payload;
  }

  async deleteForSelf(auth: RequestAuth, conversationId: string, messageId: string) {
    await this.assertParticipant(auth.userId, conversationId);

    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId
      }
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Message not found.");
    }

    await this.prisma.messageVisibility.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: auth.userId
        }
      },
      update: {
        hiddenAt: new Date()
      },
      create: {
        messageId,
        userId: auth.userId
      }
    });

    const payload = {
      conversationId,
      messageId,
      userId: auth.userId
    };

    this.realtimeGateway.emitToUsers(
      [auth.userId],
      serverSocketEventNames.messageDeletedForSelf,
      payload
    );

    return payload;
  }

  async deleteForEveryone(
    auth: RequestAuth,
    conversationId: string,
    messageId: string
  ) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId
      }
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Message not found.");
    }

    if (message.senderUserId !== auth.userId) {
      throw new ForbiddenException("Only the sender can delete for everyone.");
    }

    const updatedMessage = await this.prisma.message.update({
      where: {
        id: messageId
      },
      data: {
        deletedForEveryoneAt: new Date(),
        tombstoneType: "DELETED"
      }
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId
      }
    });
    const payload = toProtocolMessage(updatedMessage);

    this.realtimeGateway.emitToUsers(
      participants.map((participant) => participant.userId),
      serverSocketEventNames.messageDeletedForEveryone,
      payload
    );

    return payload;
  }

  async markRead(
    auth: RequestAuth,
    conversationId: string,
    lastReadMessageId: string
  ) {
    await this.assertParticipant(auth.userId, conversationId);
    const targetMessage = await this.prisma.message.findUnique({
      where: {
        id: lastReadMessageId
      }
    });

    if (!targetMessage || targetMessage.conversationId !== conversationId) {
      throw new NotFoundException("Target message not found.");
    }

    const readState = await this.prisma.readState.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.userId
        }
      },
      update: {
        lastReadMessageId,
        readAt: new Date()
      },
      create: {
        conversationId,
        userId: auth.userId,
        lastReadMessageId
      }
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId
      }
    });
    const payload = toProtocolReadState(readState);

    this.realtimeGateway.emitToUsers(
      participants.map((participant) => participant.userId),
      serverSocketEventNames.messageRead,
      payload
    );

    return payload;
  }

  private async assertParticipant(
    userId: string,
    conversationId: string
  ): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant) {
      throw new ForbiddenException("Conversation access denied.");
    }
  }
}
