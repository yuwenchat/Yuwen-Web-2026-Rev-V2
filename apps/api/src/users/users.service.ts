import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { friendCodePattern, normalizeHandle } from "@yuwen/protocol";

import type { RequestMeta } from "../common/http.js";
import { toProtocolUser } from "../common/mappers.js";
import { createFriendCode, hashValue } from "../common/security.js";
import { appEnv } from "../common/env.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return toProtocolUser(user);
  }

  async updateProfile(
    userId: string,
    input: {
      displayName?: string;
      bio?: string;
      handle?: string;
    }
  ) {
    const nextHandle = input.handle ? normalizeHandle(input.handle) : undefined;

    if (nextHandle) {
      const existing = await this.prisma.user.findFirst({
        where: {
          handle: nextHandle,
          id: {
            not: userId
          }
        }
      });

      if (existing) {
        throw new BadRequestException("This handle is already taken.");
      }
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        displayName: input.displayName,
        bio: input.bio,
        handle: nextHandle
      }
    });

    return toProtocolUser(user);
  }

  async rotateFriendCode(userId: string, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    let nextFriendCode = user.friendCode;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = createFriendCode(appEnv.friendCodeLength);

      if (friendCodePattern.test(candidate) && candidate !== user.friendCode) {
        const existing = await this.prisma.user.findUnique({
          where: {
            friendCode: candidate
          }
        });

        if (!existing) {
          nextFriendCode = candidate;
          break;
        }
      }
    }

    if (nextFriendCode === user.friendCode) {
      throw new BadRequestException("Unable to rotate friend code right now.");
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        friendCode: nextFriendCode,
        friendCodeRotations: {
          create: {
            oldCode: user.friendCode,
            newCode: nextFriendCode,
            ipHash: meta.ip ? hashValue(meta.ip) : null
          }
        }
      }
    });

    return {
      friendCode: updatedUser.friendCode
    };
  }
}

