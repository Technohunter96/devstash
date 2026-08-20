// Just the copyright line — Features/Pricing already live in the navbar, repeating them here was redundant.
// The prototype's Changelog/About/Blog/Contact/Privacy/Terms links point at pages that don't exist yet, so they're dropped too.
export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 py-10 text-center">
      <p className="text-xs text-muted-foreground/70">&copy; {year} DevStash. All rights reserved.</p>
    </footer>
  );
}