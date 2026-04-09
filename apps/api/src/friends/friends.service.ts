import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { isFriendCode } from "@yuwen/protocol";

import { toProtocolUser } from "../common/mappers.js";
import { createDirectPairKey } from "../common/security.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async requestFriend(userId: string, identifier: string) {
    const normalized = identifier.trim();
    const targetUser = await this.prisma.user.findFirst({
      where: isFriendCode(normalized)
        ? { friendCode: normalized.toUpperCase() }
        : { handle: normalized.replace(/^@+/, "").toLowerCase() }
    });

    if (!targetUser) {
      throw new NotFoundException("User not found.");
    }

    if (targetUser.id === userId) {
      throw new BadRequestException("You cannot add yourself.");
    }

    const [lowId, highId] = [userId, targetUser.id].sort();
    const existingFriendship = await this.prisma.friendship.findUnique({
      where: {
        userLowId_userHighId: {
          userLowId: lowId,
          userHighId: highId
        }
      }
    });

    if (existingFriendship) {
      throw new BadRequestException("You are already friends.");
    }

    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            recipientId: targetUser.id
          },
          {
            senderId: targetUser.id,
            recipientId: userId
          }
        ],
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return existingRequest;
    }

    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        senderId: userId,
        recipientId: targetUser.id
      }
    });

    this.realtimeGateway.emitToUsers(
      [targetUser.id],
      "friend.requested",
      friendRequest
    );

    return friendRequest;
  }

  async acceptFriendRequest(userId: string, friendRequestId: string) {
    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: {
        id: friendRequestId
      }
    });

    if (!friendRequest || friendRequest.recipientId !== userId) {
      throw new NotFoundException("Friend request not found.");
    }

    const [userLowId, userHighId] = [friendRequest.senderId, friendRequest.recipientId].sort();
    const directPairKey = createDirectPairKey(friendRequest.senderId, friendRequest.recipientId);

    await this.prisma.friendRequest.update({
      where: {
        id: friendRequest.id
      },
      data: {
        status: "ACCEPTED"
      }
    });

    const friendship = await this.prisma.friendship.upsert({
      where: {
        userLowId_userHighId: {
          userLowId,
          userHighId
        }
      },
      update: {},
      create: {
        userLowId,
        userHighId
      }
    });

    const conversation = await this.prisma.conversation.upsert({
      where: {
        directPairKey
      },
      update: {},
      create: {
        directPairKey,
        participants: {
          create: [
            {
              userId: friendRequest.senderId
            },
            {
              userId: friendRequest.recipientId
            }
          ]
        }
      }
    });

    this.realtimeGateway.emitToUsers(
      [friendRequest.senderId, friendRequest.recipientId],
      "friend.accepted",
      {
        friendshipId: friendship.id,
        conversationId: conversation.id
      }
    );

    return {
      friendshipId: friendship.id,
      conversationId: conversation.id
    };
  }

  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          {
            userLowId: userId
          },
          {
            userHighId: userId
          }
        ]
      }
    });

    const otherUserIds = friendships.map((friendship) =>
      friendship.userLowId === userId ? friendship.userHighId : friendship.userLowId
    );

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: otherUserIds
        }
      }
    });

    const directPairKeys = friendships.map((friendship) =>
      createDirectPairKey(friendship.userLowId, friendship.userHighId)
    );
    const conversations = await this.prisma.conversation.findMany({
      where: {
        directPairKey: {
          in: directPairKeys
        }
      }
    });
    const conversationByPairKey = new Map(
      conversations.map((conversation) => [conversation.directPairKey, conversation.id])
    );

    return friendships.map((friendship) => {
      const otherUserId =
        friendship.userLowId === userId ? friendship.userHighId : friendship.userLowId;
      const otherUser = users.find((user) => user.id === otherUserId);

      if (!otherUser) {
        throw new NotFoundException("Friend record is incomplete.");
      }

      const pairKey = createDirectPairKey(userId, otherUserId);

      return {
        user: toProtocolUser(otherUser),
        conversationId: conversationByPairKey.get(pairKey) ?? null,
        createdAt: friendship.createdAt.toISOString()
      };
    });
  }
}
