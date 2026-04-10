import { describe, expect, it } from "vitest";

import {
  adminListQuerySchema,
  confirmCodeSchema,
  friendRequestCreateSchema,
  isFriendCode,
  publicUserSchema,
  normalizeHandle
} from "@yuwen/protocol";

describe("protocol helpers", () => {
  it("normalizes handles by trimming and removing leading @", () => {
    expect(normalizeHandle("  @YuWen_01  ")).toBe("yuwen_01");
  });

  it("recognizes valid friend codes", () => {
    expect(isFriendCode("YW82Q4MN")).toBe(true);
    expect(isFriendCode("@lin")).toBe(false);
  });

  it("validates auth and friend request payloads", () => {
    expect(
      confirmCodeSchema.parse({
        email: "hello@example.com",
        code: "123456"
      }).code
    ).toBe("123456");

    expect(
      friendRequestCreateSchema.parse({
        identifier: "@lin"
      }).identifier
    ).toBe("@lin");
  });

  it("applies defaults for admin list queries", () => {
    expect(adminListQuerySchema.parse({}).limit).toBe(20);
    expect(
      adminListQuerySchema.parse({
        q: "hello@example.com",
        limit: "5"
      }).limit
    ).toBe(5);
  });

  it("requires an explicit user role on public user payloads", () => {
    expect(
      publicUserSchema.parse({
        id: "user_1",
        primaryEmail: "admin@example.com",
        emailVerifiedAt: null,
        role: "admin",
        friendCode: "YW82Q4MN",
        handle: "admin_user",
        profile: {
          displayName: "Admin User",
          bio: ""
        }
      }).role
    ).toBe("admin");
  });
});
