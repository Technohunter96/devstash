import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Stripe from "stripe";

vi.mock("stripe", () => ({
  default: vi.fn(),
}));

const ORIGINAL_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(Stripe).mockClear();
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_SECRET_KEY;
  });

  it("throws when STRIPE_SECRET_KEY is unset", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow();
  });

  it("returns the same cached instance on a second call", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const { getStripe } = await import("./stripe");

    const first = getStripe();
    const second = getStripe();

    expect(first).toBe(second);
    expect(Stripe).toHaveBeenCalledTimes(1);
  });
});
