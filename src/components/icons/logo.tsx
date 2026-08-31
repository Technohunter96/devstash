import { cn } from "@/lib/utils";
import LogoMark from "./logo-mark";

interface LogoProps {
  iconClassName?: string;
  textClassName?: string;
}

// Shared icon + wordmark pair — kept in sync across the marketing nav, auth pages, and dashboard TopBar
export function Logo({ iconClassName, textClassName }: LogoProps) {
  return (
    <>
      <LogoMark className={cn("size-5 text-blue-500", iconClassName)} />
      <span className={cn("font-semibold tracking-tight", textClassName)}>DevStash</span>
    </>
  );
}
