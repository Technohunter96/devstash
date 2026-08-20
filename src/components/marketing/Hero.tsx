import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChaosAnimation } from "./ChaosAnimation";
import { TransformArrow } from "./TransformArrow";
import { DashboardPreviewMock } from "./DashboardPreviewMock";
import { ScrollFadeIn } from "./ScrollFadeIn";
import { SmoothScrollLink } from "./SmoothScrollLink";

interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  const primaryCtaHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 pt-32 pb-16 text-center">
      <ScrollFadeIn className="max-w-2xl">
        <span className="mb-4 inline-block text-xs font-semibold tracking-wider text-blue-500 uppercase">
          Developer knowledge hub
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          From Scattered to <span className="text-blue-500">Stashed</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
          Snippets, prompts, commands, notes, files and links — pulled out of a dozen tools and
          into one fast, searchable stash.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={primaryCtaHref}
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 px-8 text-base")}
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
          </Link>
          <SmoothScrollLink
            targetId="features"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base")}
          >
            See Features
          </SmoothScrollLink>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn className="flex w-full items-stretch gap-6 max-sm:mx-6 max-sm:flex-col sm:items-center">
        <div className="min-w-0 flex-1">
          <span className="mb-3 block text-sm font-medium text-muted-foreground">
            Your knowledge today...
          </span>
          <ChaosAnimation />
        </div>

        <TransformArrow />

        <div className="min-w-0 flex-1">
          <span className="mb-3 block text-sm font-medium text-muted-foreground">
            ...with DevStash
          </span>
          <DashboardPreviewMock />
        </div>
      </ScrollFadeIn>
    </section>
  );
}
