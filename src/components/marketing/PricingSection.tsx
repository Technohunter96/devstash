"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollFadeIn } from "./ScrollFadeIn";

const FREE_FEATURES = [
  "50 items",
  "3 collections",
  "Snippets, prompts, commands, notes & links",
  "Basic search",
];

const PRO_MONTHLY_PRICE = 8;
const PRO_YEARLY_PRICE = 69;
const PRO_YEARLY_PRICE_AT_MONTHLY_RATE = PRO_MONTHLY_PRICE * 12;

const PRO_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI tagging, summaries & more",
  "Export your data (JSON/ZIP)",
  "Priority support",
];

interface PricingSectionProps {
  isAuthenticated: boolean;
}

export function PricingSection({ isAuthenticated }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  // Stripe checkout isn't built yet, so both plans point at signup — swap this for a checkout link once billing exists
  const ctaHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <div className="border-y border-border bg-muted/30">
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24 sm:py-32">
        <ScrollFadeIn className="mx-auto mb-14 max-w-xl text-center">
          <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-blue-500 uppercase">
            Pricing
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">Free to start. Simple to grow.</h2>

          <div className="mt-7 flex flex-nowrap items-center justify-center gap-2 sm:gap-3.5">
            <span
              className={cn(
                "text-xs whitespace-nowrap sm:text-sm",
                !isYearly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={isYearly}
              aria-label="Toggle yearly pricing"
              onClick={() => setIsYearly((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors sm:h-7 sm:w-14",
                isYearly ? "border-blue-500 bg-blue-500" : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white transition-transform sm:size-[22px]",
                  isYearly && "translate-x-5 sm:translate-x-7",
                )}
              />
            </button>
            <span
              className={cn(
                "flex items-center gap-1 whitespace-nowrap text-xs sm:gap-1.5 sm:text-sm",
                isYearly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap text-emerald-500 sm:text-[0.7rem]">
                Save 25%
              </span>
            </span>
          </div>
        </ScrollFadeIn>

        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-6">
          <ScrollFadeIn className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-8">
            <h3 className="text-base font-bold sm:text-xl">Free</h3>
            <p className="mt-1.5 mb-6 hidden text-sm text-muted-foreground sm:block">
              Everything you need to get organized.
            </p>
            <div className="mb-3 flex items-baseline gap-1 sm:mb-7">
              <span className="text-2xl font-extrabold tracking-tight sm:text-4xl">$0</span>
              <span className="text-xs text-muted-foreground sm:text-sm">/month</span>
            </div>
            <ul className="mb-4 flex flex-1 flex-col gap-1.5 sm:mb-8 sm:gap-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500 sm:size-4" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ variant: "outline" }), "justify-center px-2 text-xs sm:px-4 sm:text-sm")}
            >
              <span className="sm:hidden">{isAuthenticated ? "Dashboard" : "Get Started"}</span>
              <span className="hidden sm:inline">
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              </span>
            </Link>
          </ScrollFadeIn>

          <ScrollFadeIn className="relative flex flex-col rounded-xl border border-blue-500 bg-gradient-to-b from-blue-500/8 to-card p-4 shadow-[0_20px_40px_-20px_rgba(59,130,246,0.4)] sm:p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-2 py-0.5 text-[0.65rem] font-bold whitespace-nowrap text-white sm:px-3 sm:py-1 sm:text-xs">
              Most Popular
            </span>
            <h3 className="text-base font-bold sm:text-xl">Pro</h3>
            <p className="mt-1.5 mb-6 hidden text-sm text-muted-foreground sm:block">
              For developers who live in their tools.
            </p>
            <div className="mb-3 flex flex-wrap items-baseline gap-1 sm:mb-7 sm:gap-2">
              {isYearly && (
                <span className="text-sm text-muted-foreground line-through sm:text-lg">
                  ${PRO_YEARLY_PRICE_AT_MONTHLY_RATE}
                </span>
              )}
              <span className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                ${isYearly ? PRO_YEARLY_PRICE : PRO_MONTHLY_PRICE}
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">{isYearly ? "/year" : "/month"}</span>
            </div>
            <ul className="mb-4 flex flex-1 flex-col gap-1.5 sm:mb-8 sm:gap-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500 sm:size-4" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ variant: "default" }), "justify-center px-2 text-xs sm:px-4 sm:text-sm")}
            >
              <span className="sm:hidden">{isAuthenticated ? "Dashboard" : "Upgrade"}</span>
              <span className="hidden sm:inline">
                {isAuthenticated ? "Go to Dashboard" : "Upgrade to Pro"}
              </span>
            </Link>
          </ScrollFadeIn>
        </div>
      </section>
    </div>
  );
}
