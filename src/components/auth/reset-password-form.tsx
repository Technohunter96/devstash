"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
          </button>
        </div>
        <Input
          type={showPassword ? "text" : "password"}
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
