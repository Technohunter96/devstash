import { Suspense } from "react";
import SignInForm from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-muted-foreground">to DevStash</p>
      </div>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
