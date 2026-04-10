import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminAuthIntent,
  AdminConversation,
  AdminConversationMessage,
  AdminFriendCodeRotation,
  AdminOverview,
  AdminUser
} from "@yuwen/protocol";

import { PrismaService } from "../prisma/prisma.service.js";

type ListQuery = {
  q?: string;
  limit: number;
};

function lower(input: string | null | undefined): string {
  return input?.toLowerCase() ?? "";
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminOverview> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const [
      users,
      devices,
      activeSessions,
      conversations,
      messages,
      pendingFriendRequests,
      authIntentsLast24Hours,
      recentUsers,
      recentAuthIntents
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.device.count(),
      this.prisma.deviceSession.count({
        where: {
          refreshExpiresAt: {
            gt: new Date()
          }
        }
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.friendRequest.count({
        where: {
          status: "PENDING"
        }
      }),
      this.prisma.authIntent.count({
        where: {
          createdAt: {
            gte: since
          }
        }
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.prisma.authIntent.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return {
      totals: {
        users,
        devices,
        activeSessions,
        conversations,
        messages,
        pendingFriendRequests,
        authIntentsLast24Hours
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        primaryEmail: user.primaryEmail,
        handle: user.handle,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null
      })),
      recentAuthIntents: recentAuthIntents.map((intent) => ({
        id: intent.id,
        email: intent.email,
        purpose: intent.purpose === "REGISTER" ? "register" : "login",
        channel: intent.channel === "CODE" ? "code" : "magic_link",
        createdAt: intent.createdAt.toISOString(),
        expiresAt: intent.expiresAt.toISOString(),
        consumedAt: intent.consumedAt?.toISOString() ?? null,
        attempts: intent.attempts
      }))
    };
  }

  async listUsers(query: ListQuery): Promise<AdminUser[]> {
    const rawUsers = await this.prisma.user.findMany({
      take: query.limit,
      where: query.q
        ? {
            OR: [
              { primaryEmail: { contains: query.q, mode: "insensitive" } },
              { handle: { contains: lower(query.q), mode: "insensitive" } },
              { displayName: { contains: query.q, mode: "insensitive" } },
              { friendCode: { contains: query.q.toUpperCase() } }
            ]
          }
        : undefined,
      include: {
        devices: {
          take: 1,
          orderBy: {
            lastSeenAt: "desc"
          }
        },
        _count: {
          select: {
            devices: true,
            sessions: true,
            sentMessages: true,
            friendCodeRotations: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return rawUsers.map((user) => ({
      user: {
        id: user.id,
        primaryEmail: user.primaryEmail,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        role: user.role === "ADMIN" ? "admin" : "user",
        friendCode: user.friendCode,
        handle: user.handle,
        profile: {
          displayName: user.displayName,
          bio: user.bio
        }
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      devicesCount: user._count.devices,
      sessionsCount: user._count.sessions,
      sentMessagesCount: user._count.sentMessages,
      friendCodeRotationsCount: user._count.friendCodeRotations,
      lastSeenAt: user.devices[0]?.lastSeenAt.toISOString() ?? null
    }));
  }

  async listConversations(query: ListQuery): Promise<AdminConversation[]> {
    const rawConversations = await this.prisma.conversation.findMany({
      take: query.limit,
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
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return rawConversations
      .filter((conversation) => {
        if (!query.q) {
          return true;
        }

        const haystack = conversation.participants
          .map((participant) =>
            [
              participant.user.displayName,
              participant.user.handle,
              participant.user.primaryEmail
            ].join(" ")
          )
          .join(" ")
          .toLowerCase();

        return haystack.includes(query.q.toLowerCase());
      })
      .map((conversation) => ({
        id: conversation.id,
        securityMode:
          conversation.securityMode === "TRANSPORT_PROTECTED"
            ? "transport_protected"
            : conversation.securityMode === "E2EE_READY"
              ? "e2ee_ready"
              : "e2ee_verified",
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messageCount: conversation._count.messages,
        participants: conversation.participants.map((participant) => ({
          id: participant.user.id,
          displayName: participant.user.displayName,
          handle: participant.user.handle,
          primaryEmail: participant.user.primaryEmail
        })),
        lastMessage: conversation.messages[0]
          ? {
              id: conversation.messages[0].id,
              preview:
                typeof conversation.messages[0].payload === "object" &&
                conversation.messages[0].payload &&
                "text" in conversation.messages[0].payload
                  ? String(
                      (conversation.messages[0].payload as { text: unknown }).text
                    )
                  : "",
              sentAt: conversation.messages[0].sentAt.toISOString(),
              deletedForEveryoneAt:
                conversation.messages[0].deletedForEveryoneAt?.toISOString() ?? null
            }
          : null
      }));
  }

  async listConversationMessages(
    conversationId: string
  ): Promise<AdminConversationMessage[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId
      }
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found.");
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId
      },
      take: 50,
      orderBy: {
        sentAt: "desc"
      },
      include: {
        senderUser: true
      }
    });

    return messages.map((message) => ({
      id: message.id,
      senderUserId: message.senderUserId,
      senderDisplayName: message.senderUser.displayName,
      text:
        typeof message.payload === "object" &&
        message.payload &&
        "text" in message.payload
          ? String((message.payload as { text: unknown }).text)
          : "",
      sentAt: message.sentAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedForEveryoneAt:
        message.deletedForEveryoneAt?.toISOString() ?? null
    }));
  }

  async listAuthIntents(query: ListQuery): Promise<AdminAuthIntent[]> {
    const intents = await this.prisma.authIntent.findMany({
      take: query.limit,
      where: query.q
        ? {
            email: {
              contains: query.q,
              mode: "insensitive"
            }
          }
        : undefined,
      orderBy: {
        createdAt: "desc"
      }
    });

    return intents.map((intent) => ({
      id: intent.id,
      email: intent.email,
      purpose: intent.purpose === "REGISTER" ? "register" : "login",
      channel: intent.channel === "CODE" ? "code" : "magic_link",
      createdAt: intent.createdAt.toISOString(),
      expiresAt: intent.expiresAt.toISOString(),
      consumedAt: intent.consumedAt?.toISOString() ?? null,
      attempts: intent.attempts,
      deviceName: intent.deviceName ?? null
    }));
  }

  async listFriendCodeRotations(
    query: ListQuery
  ): Promise<AdminFriendCodeRotation[]> {
    const rotations = await this.prisma.friendCodeRotation.findMany({
      take: query.limit,
      include: {
        user: true
      },
      orderBy: {
        rotatedAt: "desc"
      }
    });

    return rotations
      .filter((rotation) => {
        if (!query.q) {
          return true;
        }

        const haystack = [
          rotation.user.primaryEmail,
          rotation.user.handle,
          rotation.oldCode,
          rotation.newCode
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query.q.toLowerCase());
      })
      .map((rotation) => ({
        id: rotation.id,
        userId: rotation.userId,
        primaryEmail: rotation.user.primaryEmail,
        handle: rotation.user.handle,
        oldCode: rotation.oldCode,
        newCode: rotation.newCode,
        rotatedAt: rotation.rotatedAt.toISOString()
      }));
  }
}
