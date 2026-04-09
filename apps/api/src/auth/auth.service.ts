import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  type AuthIntentChannel,
  type AuthIntentPurpose,
  type AuthSession
} from "@yuwen/protocol";
import { DevicePlatform, type User as PrismaUser } from "@prisma/client";

import { appEnv } from "../common/env.js";
import type { RequestMeta } from "../common/http.js";
import { toProtocolDevice, toProtocolUser } from "../common/mappers.js";
import {
  createFriendCode,
  hashPassword,
  hashValue,
  inferHandleBase,
  randomNumericCode,
  randomToken,
  verifyPassword
} from "../common/security.js";
import { MAIL_PROVIDER, type MailProvider } from "../mail/mail.provider.js";
import { PrismaService } from "../prisma/prisma.service.js";

type RequestAuthIntentInput = {
  email: string;
  purpose: AuthIntentPurpose;
  redirectTo?: string;
  deviceName: string;
  meta: RequestMeta;
};

type ConfirmCodeInput = {
  email: string;
  code: string;
  purpose: AuthIntentPurpose;
  deviceName: string;
  meta: RequestMeta;
};

type ConsumeMagicLinkInput = {
  email: string;
  token: string;
  purpose: AuthIntentPurpose;
  deviceName: string;
  meta: RequestMeta;
};

type PasswordLoginInput = {
  email: string;
  password: string;
  deviceName: string;
  meta: RequestMeta;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider
  ) {}

  async requestCode(input: RequestAuthIntentInput) {
    await this.assertAccountState(input.email, input.purpose);
    await this.assertRateLimit(input.email, input.purpose);

    const code = randomNumericCode(6);
    const expiresAt = new Date(
      Date.now() + appEnv.authCodeTtlMinutes * 60 * 1_000
    );

    await this.prisma.authIntent.create({
      data: {
        email: input.email,
        purpose: this.toPrismaPurpose(input.purpose),
        channel: "CODE",
        codeHash: hashValue(code),
        expiresAt,
        ipHash: input.meta.ip ? hashValue(input.meta.ip) : null,
        uaHash: input.meta.userAgent ? hashValue(input.meta.userAgent) : null,
        deviceName: input.deviceName,
        redirectTo: input.redirectTo
      }
    });

    await this.mailProvider.sendAuthCode({
      email: input.email,
      code,
      purpose: input.purpose,
      expiresInMinutes: appEnv.authCodeTtlMinutes
    });

    return {
      ok: true,
      channel: "code" satisfies AuthIntentChannel,
      expiresAt: expiresAt.toISOString()
    };
  }

  async confirmCode(input: ConfirmCodeInput): Promise<AuthSession> {
    const authIntent = await this.prisma.authIntent.findFirst({
      where: {
        email: input.email,
        purpose: this.toPrismaPurpose(input.purpose),
        channel: "CODE",
        consumedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!authIntent) {
      throw new NotFoundException("No verification code found.");
    }

    if (authIntent.expiresAt < new Date()) {
      throw new UnauthorizedException("Verification code expired.");
    }

    if (authIntent.attempts >= 5) {
      throw new UnauthorizedException("Too many failed attempts.");
    }

    if (authIntent.codeHash !== hashValue(input.code)) {
      await this.prisma.authIntent.update({
        where: {
          id: authIntent.id
        },
        data: {
          attempts: {
            increment: 1
          }
        }
      });
      throw new UnauthorizedException("Invalid verification code.");
    }

    await this.prisma.authIntent.update({
      where: {
        id: authIntent.id
      },
      data: {
        consumedAt: new Date()
      }
    });

    const user = await this.resolveUserForPurpose(input.email, input.purpose);
    return this.issueSession(user, input.deviceName);
  }

  async requestMagicLink(input: RequestAuthIntentInput) {
    await this.assertAccountState(input.email, input.purpose);
    await this.assertRateLimit(input.email, input.purpose);

    const token = randomToken(24);
    const expiresAt = new Date(
      Date.now() + appEnv.magicLinkTtlMinutes * 60 * 1_000
    );

    await this.prisma.authIntent.create({
      data: {
        email: input.email,
        purpose: this.toPrismaPurpose(input.purpose),
        channel: "MAGIC_LINK",
        magicTokenHash: hashValue(token),
        expiresAt,
        redirectTo: input.redirectTo,
        ipHash: input.meta.ip ? hashValue(input.meta.ip) : null,
        uaHash: input.meta.userAgent ? hashValue(input.meta.userAgent) : null,
        deviceName: input.deviceName
      }
    });

    const linkBase = input.redirectTo ?? `${appEnv.webAppUrl}/auth/verify`;
    const separator = linkBase.includes("?") ? "&" : "?";
    const link = `${linkBase}${separator}purpose=${input.purpose}&email=${encodeURIComponent(input.email)}&token=${token}`;

    await this.mailProvider.sendMagicLink({
      email: input.email,
      link,
      purpose: input.purpose,
      expiresInMinutes: appEnv.magicLinkTtlMinutes
    });

    return {
      ok: true,
      channel: "magic_link" satisfies AuthIntentChannel,
      expiresAt: expiresAt.toISOString()
    };
  }

  async consumeMagicLink(input: ConsumeMagicLinkInput): Promise<AuthSession> {
    const authIntent = await this.prisma.authIntent.findFirst({
      where: {
        email: input.email,
        purpose: this.toPrismaPurpose(input.purpose),
        channel: "MAGIC_LINK",
        consumedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!authIntent || !authIntent.magicTokenHash) {
      throw new NotFoundException("Magic link not found.");
    }

    if (authIntent.expiresAt < new Date()) {
      throw new UnauthorizedException("Magic link expired.");
    }

    if (authIntent.magicTokenHash !== hashValue(input.token)) {
      throw new UnauthorizedException("Magic link is invalid.");
    }

    await this.prisma.authIntent.update({
      where: {
        id: authIntent.id
      },
      data: {
        consumedAt: new Date()
      }
    });

    const user = await this.resolveUserForPurpose(input.email, input.purpose);
    return this.issueSession(user, input.deviceName);
  }

  async loginWithPassword(input: PasswordLoginInput): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: {
        primaryEmail: input.email
      },
      include: {
        passwordCredential: true
      }
    });

    if (!user || !user.passwordCredential) {
      throw new UnauthorizedException("Password login is not available.");
    }

    if (!verifyPassword(input.password, user.passwordCredential.passwordHash)) {
      throw new UnauthorizedException("Incorrect email or password.");
    }

    return this.issueSession(user, input.deviceName);
  }

  async setPassword(userId: string, password: string) {
    await this.prisma.passwordCredential.upsert({
      where: {
        userId
      },
      update: {
        passwordHash: hashPassword(password)
      },
      create: {
        userId,
        passwordHash: hashPassword(password)
      }
    });

    return {
      ok: true
    };
  }

  async refresh(refreshToken: string, _meta: RequestMeta): Promise<AuthSession> {
    const session = await this.prisma.deviceSession.findUnique({
      where: {
        refreshTokenHash: hashValue(refreshToken)
      },
      include: {
        user: true,
        device: true
      }
    });

    if (!session || session.refreshExpiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired.");
    }

    const accessToken = randomToken(32);
    const nextRefreshToken = randomToken(32);
    const expiresAt = new Date(
      Date.now() + appEnv.accessTokenTtlMinutes * 60 * 1_000
    );
    const refreshExpiresAt = new Date(
      Date.now() + appEnv.refreshTokenTtlDays * 24 * 60 * 60 * 1_000
    );

    await this.prisma.deviceSession.update({
      where: {
        id: session.id
      },
      data: {
        accessTokenHash: hashValue(accessToken),
        refreshTokenHash: hashValue(nextRefreshToken),
        expiresAt,
        refreshExpiresAt,
        lastSeenAt: new Date()
      }
    });

    return {
      user: toProtocolUser(session.user),
      device: toProtocolDevice(session.device),
      accessToken,
      refreshToken: nextRefreshToken
    };
  }

  private async resolveUserForPurpose(
    email: string,
    purpose: AuthIntentPurpose
  ) {
    if (purpose === "register") {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          primaryEmail: email
        }
      });

      if (existingUser) {
        throw new ConflictException("This email is already registered.");
      }

      return this.createUser(email);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        primaryEmail: email
      }
    });

    if (!existingUser) {
      throw new NotFoundException("No account found for this email.");
    }

    return existingUser;
  }

  private async createUser(email: string) {
    const handle = await this.allocateHandle(inferHandleBase(email));
    const friendCode = await this.allocateFriendCode();
    const displayName = handle.replace(/_/g, " ");

    return this.prisma.user.create({
      data: {
        primaryEmail: email,
        emailVerifiedAt: new Date(),
        friendCode,
        handle,
        displayName,
        bio: "在语闻上开启安全而克制的对话。"
      }
    });
  }

  private async issueSession(
    user: PrismaUser,
    deviceName: string
  ): Promise<AuthSession> {
    const userId = user.id;
    const accessToken = randomToken(32);
    const refreshToken = randomToken(32);
    const expiresAt = new Date(
      Date.now() + appEnv.accessTokenTtlMinutes * 60 * 1_000
    );
    const refreshExpiresAt = new Date(
      Date.now() + appEnv.refreshTokenTtlDays * 24 * 60 * 60 * 1_000
    );

    const device = await this.prisma.device.create({
      data: {
        userId,
        platform: DevicePlatform.WEB,
        name: deviceName,
        trustState: "TRUSTED"
      }
    });

    await this.prisma.deviceSession.create({
      data: {
        userId,
        deviceId: device.id,
        accessTokenHash: hashValue(accessToken),
        refreshTokenHash: hashValue(refreshToken),
        expiresAt,
        refreshExpiresAt
      }
    });

    const persistedUser = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!persistedUser) {
      throw new NotFoundException("Unable to create session.");
    }

    return {
      user: toProtocolUser(persistedUser),
      device: toProtocolDevice(device),
      accessToken,
      refreshToken
    };
  }

  private async allocateFriendCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = createFriendCode(appEnv.friendCodeLength);
      const existing = await this.prisma.user.findUnique({
        where: {
          friendCode: candidate
        }
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException("Unable to allocate a friend code.");
  }

  private async allocateHandle(base: string): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
      const existing = await this.prisma.user.findUnique({
        where: {
          handle: candidate
        }
      });

      if (!existing) {
        return candidate;
      }
    }

    return `${base}${randomToken(3).toLowerCase()}`;
  }

  private async assertRateLimit(
    email: string,
    purpose: AuthIntentPurpose
  ): Promise<void> {
    const threshold = new Date(Date.now() - 15 * 60 * 1_000);
    const attempts = await this.prisma.authIntent.count({
      where: {
        email,
        purpose: this.toPrismaPurpose(purpose),
        createdAt: {
          gte: threshold
        }
      }
    });

    if (attempts >= 5) {
      throw new BadRequestException("Too many authentication attempts.");
    }
  }

  private async assertAccountState(
    email: string,
    purpose: AuthIntentPurpose
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        primaryEmail: email
      }
    });

    if (purpose === "register" && existingUser) {
      throw new ConflictException("This email is already registered.");
    }

    if (purpose === "login" && !existingUser) {
      throw new NotFoundException("No account found for this email.");
    }
  }

  private toPrismaPurpose(purpose: AuthIntentPurpose): "REGISTER" | "LOGIN" {
    return purpose === "register" ? "REGISTER" : "LOGIN";
  }
}
