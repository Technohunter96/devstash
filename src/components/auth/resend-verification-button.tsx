"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  email?: string;
}

export default function ResendVerificationButton({ email }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleResend() {
    setStatus("loading");
    setErrorMessage("");

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus("sent");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMessage(data.error ?? "Something went wrong. Please try again later.");
      setStatus("error");
    }
  }

  // No email available — show plain text without resend option
  if (!email) {
    return (
      <p className="text-xs text-muted-foreground">
        The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder.
      </p>
    );
  }

  if (status === "sent") {
    return (
      <p className="text-xs text-muted-foreground">
        The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder or{" "}
        <span className="text-green-500">email sent!</span>
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder or{" "}
      <button
        onClick={handleResend}
        disabled={status === "loading"}
        className="underline underline-offset-4 hover:text-foreground cursor-pointer disabled:opacity-50"
      >
        {status === "loading" ? "sending..." : "resend email"}
      </button>
      {status === "error" && (
        <span className="text-destructive"> — {errorMessage}</span>
      )}
    </p>
  );
}