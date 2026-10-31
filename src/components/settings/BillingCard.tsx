"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, createBillingPortalSession } from "@/actions/billing";
import { PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE } from "@/lib/constants/billing";

interface Props {
  isPro: boolean;
}

export default function BillingCard({ isPro }: Props) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | "portal" | null>(null);
  const searchParams = useSearchParams();
  const toasted = useRef(false);

  // Feedback after returning from Stripe Checkout
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout || toasted.current) return;
    toasted.current = true;
    if (checkout === "success") toast.success("Payment received. Your plan will update in a moment.");
    if (checkout === "cancelled") toast.info("Checkout cancelled.");
  }, [searchParams]);

  async function redirectTo(
    key: "monthly" | "yearly" | "portal",
    action: () => Promise<{ success: true; url: string } | { success: false; error: string }>,
  ) {
    setLoading(key);
    const result = await action();
    if (result.success) {
      window.location.href = result.url;
      return;
    }
    toast.error(result.error);
    setLoading(null);
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-base font-semibold">Billing</h2>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium">{isPro ? "Pro plan" : "Free plan"}</p>
          <p className="text-sm text-muted-foreground">
            {isPro
              ? "Unlimited items and collections, file uploads and AI features."
              : "Limited to 50 items and 3 collections. Upgrade for unlimited access."}
          </p>
        </div>
        {isPro ? (
          <Button
            variant="outline"
            className="cursor-pointer gap-2 shrink-0"
            disabled={loading !== null}
            onClick={() => redirectTo("portal", createBillingPortalSession)}
          >
            <CreditCard className="size-4" />
            {loading === "portal" ? "Opening..." : "Manage Billing"}
          </Button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="cursor-pointer gap-2"
              disabled={loading !== null}
              onClick={() => redirectTo("monthly", () => createCheckoutSession("monthly"))}
            >
              {loading === "monthly" ? "Redirecting..." : `$${PRO_MONTHLY_PRICE}/month`}
            </Button>
            <Button
              className="cursor-pointer gap-2"
              disabled={loading !== null}
              onClick={() => redirectTo("yearly", () => createCheckoutSession("yearly"))}
            >
              <Sparkles className="size-4" />
              {loading === "yearly" ? "Redirecting..." : `Upgrade · $${PRO_YEARLY_PRICE}/year`}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}