import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResendVerificationButton from "@/components/auth/resend-verification-button";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailSentPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link{email ? ` to ${email}` : " to your email address"}. Click
          the link to activate your account.
        </p>
      </div>

      <Suspense>
        <ResendVerificationButton email={email} />
      </Suspense>

      <Link
        href="/sign-in"
        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
      >
        Back to sign in
      </Link>
    </div>
  );
}
