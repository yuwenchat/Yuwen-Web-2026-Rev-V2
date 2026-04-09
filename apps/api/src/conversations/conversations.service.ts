import { Injectable } from "@nestjs/common";

import {
  toProtocolConversation,
  toProtocolMessage,
  toProtocolReadState,
  toProtocolUser
} from "../common/mappers.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            sentAt: "desc"
          }
        },
        readStates: {
          where: {
            userId
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const participantIds = conversation.participants.map(
          (participant) => participant.userId
        );
        const readState = conversation.readStates[0] ?? null;
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderUserId: {
              not: userId
            },
            sentAt: readState
              ? {
                  gt: readState.readAt
                }
              : undefined
          }
        });

        return {
          conversation: toProtocolConversation(conversation, participantIds),
          participants: conversation.participants.map((participant) =>
            toProtocolUser(participant.user)
          ),
          lastMessage: conversation.messages[0]
            ? toProtocolMessage(conversation.messages[0])
            : null,
          readState: readState ? toProtocolReadState(readState) : null,
          unreadCount,
          typingUserIds: []
        };
      })
    );
  }
}
