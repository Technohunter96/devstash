import Link from "next/link";
import { Code } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Code className="size-5 text-blue-500" />
        DevStash
      </Link>
      <div className="w-full max-w-sm space-y-6">{children}</div>
    </div>
  );
}
