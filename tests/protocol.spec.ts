import { describe, expect, it } from "vitest";

import {
  confirmCodeSchema,
  friendRequestCreateSchema,
  isFriendCode,
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
});
