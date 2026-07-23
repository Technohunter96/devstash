"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/password-input";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/sign-in?reset=1");
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">
        Invalid reset link.{" "}
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordInput
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordInput
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Set new password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
