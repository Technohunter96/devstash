import { describe, it, expect, vi } from "vitest";
import {
  isPasswordResetToken,
  emailFromPasswordResetIdentifier,
} from "./tokens";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("isPasswordResetToken", () => {
  it("returns true for password-reset identifiers", () => {
    expect(isPasswordResetToken("password-reset:user@example.com")).toBe(true);
  });

  it("returns false for plain email identifiers", () => {
    expect(isPasswordResetToken("user@example.com")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPasswordResetToken("")).toBe(false);
  });
});

describe("emailFromPasswordResetIdentifier", () => {
  it("strips the prefix and returns the email", () => {
    expect(emailFromPasswordResetIdentifier("password-reset:user@example.com")).toBe(
      "user@example.com"
    );
  });

  it("handles emails with subdomains", () => {
    expect(
      emailFromPasswordResetIdentifier("password-reset:user@mail.example.co.uk")
    ).toBe("user@mail.example.co.uk");
  });
});