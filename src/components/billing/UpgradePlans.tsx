"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/actions/billing";
import {
  PRO_MONTHLY_PRICE,
  PRO_YEARLY_PRICE,
  PRO_YEARLY_SAVINGS_PERCENT,
} from "@/lib/constants/billing";

interface Feature {
  label: string;
  included: boolean;
}

const FREE_FEATURES: Feature[] = [
  { label: "50 items", included: true },
  { label: "3 collections", included: true },
  { label: "Snippets, Prompts, Commands, Notes, Links", included: true },
  { label: "Basic search", included: true },
  { label: "File & Image uploads", included: false },
  { label: "AI features", included: false },
];

const PRO_FEATURES: Feature[] = [
  { label: "Unlimited items", included: true },
  { label: "Unlimited collections", included: true },
  { label: "All item types including Files & Images", included: true },
  { label: "AI auto-tagging & summaries", included: true },
  { label: "“Explain This Code”", included: true },
  { label: "Data export (JSON/ZIP)", included: true },
];

function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="flex flex-1 flex-col gap-2.5">
      {features.map(({ label, included }) => (
        <li
          key={label}
          className={cn(
            "flex items-start gap-2 text-sm",
            included ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {included ? (
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
          ) : (
            <X className="mt-0.5 size-4 shrink-0" />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}

// Plan comparison with a monthly/yearly toggle; the Pro button starts Stripe Checkout
export default function UpgradePlans() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const result = await createCheckoutSession(isYearly ? "yearly" : "monthly");
    if (result.success) {
      window.location.href = result.url;
      return;
    }
    toast.error(result.error);
    setLoading(false);
  }

  const price = isYearly ? PRO_YEARLY_PRICE : PRO_MONTHLY_PRICE;
  const suffix = isYearly ? "/year" : "/month";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className={isYearly ? "text-muted-foreground" : "text-foreground"}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={isYearly}
          aria-label="Toggle yearly pricing"
          onClick={() => setIsYearly((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors",
            isYearly ? "border-blue-500 bg-blue-500" : "border-border bg-card",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white transition-transform",
              isYearly && "translate-x-5",
            )}
          />
        </button>
        <span
          className={cn(
            "flex items-center gap-1.5",
            isYearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Yearly
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-500">
            Save {PRO_YEARLY_SAVINGS_PERCENT}%
          </span>
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Free</h2>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight">$0</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Your current plan</p>
          <FeatureList features={FREE_FEATURES} />
          <Button variant="outline" disabled className="mt-6 w-full">
            Current Plan
          </Button>
        </div>

        <div className="relative flex flex-col rounded-xl border border-blue-500 bg-gradient-to-b from-blue-500/8 to-card p-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
            Recommended
          </span>
          <h2 className="text-lg font-bold">Pro</h2>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight">${price}</span>
            <span className="text-sm text-muted-foreground">{suffix}</span>
          </div>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">For serious developers</p>
          <FeatureList features={PRO_FEATURES} />
          <Button
            className="mt-6 w-full cursor-pointer"
            disabled={loading}
            onClick={handleUpgrade}
          >
            {loading ? "Redirecting..." : `Upgrade to Pro ($${price}${isYearly ? "/yr" : "/mo"})`}
          </Button>
        </div>
      </div>
    </div>
  );
}