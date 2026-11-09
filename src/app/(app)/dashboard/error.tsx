"use client";

import ErrorPage from "@/components/ui/error-page";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      message="Failed to load your dashboard. This is usually a temporary issue."
    />
  );
}