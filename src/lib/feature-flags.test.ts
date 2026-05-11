import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isEmailVerificationEnabled } from "./feature-flags";

describe("isEmailVerificationEnabled", () => {
  const original = process.env.EMAIL_VERIFICATION_ENABLED;

  afterEach(() => {
    process.env.EMAIL_VERIFICATION_ENABLED = original;
  });

  it('returns true when env var is "true"', () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "true";
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("returns false when env var is absent", () => {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it('returns false when env var is "false"', () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("returns false for arbitrary non-true values", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "1";
    expect(isEmailVerificationEnabled()).toBe(false);
  });
});