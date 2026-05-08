import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
