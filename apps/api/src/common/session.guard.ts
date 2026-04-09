import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import { hashValue } from "./security.js";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers?.authorization;
    const headerValue =
      typeof authorizationHeader === "string" ? authorizationHeader : undefined;
    const token = headerValue?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const session = await this.prisma.deviceSession.findUnique({
      where: {
        accessTokenHash: hashValue(token)
      },
      include: {
        user: true,
        device: true
      }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired.");
    }

    await this.prisma.deviceSession.update({
      where: {
        id: session.id
      },
      data: {
        lastSeenAt: new Date()
      }
    });

    request.auth = {
      userId: session.userId,
      sessionId: session.id,
      deviceId: session.deviceId
    };

    return true;
  }
}
