"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSession, createBillingPortalSession } from "@/actions/billing";
import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_MONTHLY_PRICE,
  PRO_YEARLY_PRICE,
} from "@/lib/constants/billing";
import { getUsageLevel, type UsageLevel } from "@/lib/usage-limits";

interface Props {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

const BAR_COLORS: Record<UsageLevel, string> = {
  ok: "bg-blue-500",
  warning: "bg-yellow-500",
  full: "bg-red-500",
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const level = getUsageLevel(used, limit);
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        {/* Dynamic width can't be a static Tailwind class */}
        <div
          className={`h-full rounded-full transition-all ${BAR_COLORS[level]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingCard({ isPro, itemCount, collectionCount }: Props) {
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

  if (isPro) {
    return (
      <Card
        id="billing"
        className="p-6 space-y-4 scroll-mt-6 border-transparent bg-gradient-to-br from-blue-500/15 via-card to-purple-500/15 ring-1 ring-purple-500/40"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-semibold">Billing</h2>
          <Badge className="gap-1 border-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Sparkles className="size-3" />
            Pro
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">You&apos;re a Pro user</p>
            <p className="text-sm text-muted-foreground">
              Unlimited items and collections, file uploads and AI features.
            </p>
          </div>
          <Button
            variant="outline"
            className="cursor-pointer gap-2 shrink-0"
            disabled={loading !== null}
            onClick={() => redirectTo("portal", createBillingPortalSession)}
          >
            <CreditCard className="size-4" />
            {loading === "portal" ? "Opening..." : "Manage Billing"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card id="billing" className="p-6 space-y-5 scroll-mt-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold">Billing</h2>
        <Badge variant="secondary">Free plan</Badge>
      </div>
      <div className="space-y-3">
        <UsageBar label="Items" used={itemCount} limit={FREE_ITEM_LIMIT} />
        <UsageBar label="Collections" used={collectionCount} limit={FREE_COLLECTION_LIMIT} />
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">Upgrade for unlimited access, file uploads and AI features.</p>
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
      </div>
    </Card>
  );
}