import { auth } from "@/auth";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar isAuthenticated={isAuthenticated} />
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-24">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>
    </div>
  );
}
