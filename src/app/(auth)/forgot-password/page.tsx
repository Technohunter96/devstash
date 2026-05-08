import { Suspense } from "react";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </>
  );
}
