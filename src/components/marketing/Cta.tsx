import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollFadeIn } from "./ScrollFadeIn";

interface CtaProps {
  isAuthenticated: boolean;
}

export function Cta({ isAuthenticated }: CtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <ScrollFadeIn className="rounded-xl bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1),_transparent_70%)] px-8 py-18 text-center">
        <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Ready to organize your knowledge?</h2>
        <p className="mb-8 text-muted-foreground">
          Join developers who stopped losing their best snippets, prompts and commands.
        </p>
        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 px-8 text-base")}
        >
          {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
        </Link>
      </ScrollFadeIn>
    </section>
  );
}