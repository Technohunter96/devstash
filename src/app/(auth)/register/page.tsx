import { Suspense } from "react";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-sm text-muted-foreground">Join DevStash</p>
      </div>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
