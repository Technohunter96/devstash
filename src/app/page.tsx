import { auth } from "@/auth";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { AiSection } from "@/components/marketing/AiSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { Cta } from "@/components/marketing/Cta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default async function Home() {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <>
      <MarketingNavbar isAuthenticated={isAuthenticated} />
      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <Features />
        <AiSection />
        <PricingSection isAuthenticated={isAuthenticated} />
        <Cta isAuthenticated={isAuthenticated} />
      </main>
      <MarketingFooter />
    </>
  );
}