import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCheckoutSession, createBillingPortalSession } from "./billing";

const mockAuth = vi.fn();
const mockGetCustomerId = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();
const priceIds: { monthly?: string; yearly?: string } = {};

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/billing", () => ({
  getStripeCustomerIdByUserId: (...args: unknown[]) => mockGetCustomerId(...args),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: (...args: unknown[]) => mockCheckoutCreate(...args) } },
    billingPortal: { sessions: { create: (...args: unknown[]) => mockPortalCreate(...args) } },
  }),
  STRIPE_PRICE_IDS: {
    get monthly() {
      return priceIds.monthly;
    },
    get yearly() {
      return priceIds.yearly;
    },
  },
}));

const SESSION = { user: { id: "user-1", email: "a@b.cz" } };

beforeEach(() => {
  mockAuth.mockReset();
  mockGetCustomerId.mockReset();
  mockCheckoutCreate.mockReset();
  mockPortalCreate.mockReset();
  priceIds.monthly = "price_monthly";
  priceIds.yearly = "price_yearly";
});

describe("createCheckoutSession", () => {
  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await createCheckoutSession("monthly")).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("refuses to create a second subscription for Pro users", async () => {
    mockAuth.mockResolvedValue({ user: { ...SESSION.user, isPro: true } });
    const result = await createCheckoutSession("monthly");
    expect(result.success).toBe(false);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns error when the price ID for the interval is missing", async () => {
    mockAuth.mockResolvedValue(SESSION);
    priceIds.yearly = undefined;
    const result = await createCheckoutSession("yearly");
    expect(result.success).toBe(false);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns the checkout URL and passes the user ID as client_reference_id", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCustomerId.mockResolvedValue(null);
    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/x" });
    const result = await createCheckoutSession("yearly");
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/x" });
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: "user-1",
        line_items: [{ price: "price_yearly", quantity: 1 }],
      }),
    );
  });

  it("reuses the existing Stripe customer when there is one", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCustomerId.mockResolvedValue("cus_123");
    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/x" });
    await createCheckoutSession("monthly");
    expect(mockCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_123" }));
  });
});

describe("createBillingPortalSession", () => {
  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await createBillingPortalSession()).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when the user has no Stripe customer", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCustomerId.mockResolvedValue(null);
    expect(await createBillingPortalSession()).toEqual({
      success: false,
      error: "No billing account found",
    });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it("returns the portal URL", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCustomerId.mockResolvedValue("cus_123");
    mockPortalCreate.mockResolvedValue({ url: "https://billing.stripe.com/p" });
    expect(await createBillingPortalSession()).toEqual({
      success: true,
      url: "https://billing.stripe.com/p",
    });
  });
});