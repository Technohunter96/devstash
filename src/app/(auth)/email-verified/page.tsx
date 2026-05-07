import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmailVerifiedPage() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Email verified!</h1>
        <p className="text-sm text-muted-foreground">
          Your account is now active. Sign in to start using DevStash.
        </p>
      </div>

      <Link href="/sign-in" className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}>
        Sign in
      </Link>
    </div>
  );
}