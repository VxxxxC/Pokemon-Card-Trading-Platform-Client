import { describe, expect, test } from "bun:test";
import {
  assertMemberPersonaForPersonalFeatures,
  isMemberPersona,
  MEMBER_PERSONA_FEATURES_BLOCKED_ERROR,
} from "@/lib/auth/member-persona-features";

describe("member persona feature guards", () => {
  test("isMemberPersona treats merchant as blocked", () => {
    expect(isMemberPersona("member")).toBe(true);
    expect(isMemberPersona("merchant")).toBe(false);
    expect(isMemberPersona(undefined)).toBe(true);
  });

  test("assertMemberPersonaForPersonalFeatures blocks merchant", () => {
    expect(assertMemberPersonaForPersonalFeatures("merchant")).toEqual({
      ok: false,
      error: MEMBER_PERSONA_FEATURES_BLOCKED_ERROR,
    });
    expect(assertMemberPersonaForPersonalFeatures("member")).toEqual({
      ok: true,
    });
  });
});
