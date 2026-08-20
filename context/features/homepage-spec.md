# Homepage Spec

## Overview

Replace the placeholder root page (`src/app/page.tsx`) with the real marketing homepage, built from the static prototype in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Same visual design and copy — rebuilt as Next.js server/client components with Tailwind v4 + shadcn, wired to real routes.

`/` is not in `proxy.ts`'s matcher, so it stays public — no auth guard needed.

## Component Structure

New feature folder `src/components/marketing/`. Split by interactivity per `coding-standards.md` (pages are server components; `'use client'` only where needed, extracted into child components):

| Component | Type | Why |
|---|---|---|
| `MarketingNavbar.tsx` | client | scroll listener for opacity, mobile menu toggle state |
| `Hero.tsx` | server | static headline/subheadline/CTAs, renders visual below |
| `ChaosAnimation.tsx` | client | `requestAnimationFrame` drift/bounce/repel loop, mouse tracking |
| `TransformArrow.tsx` | server | pure CSS animation, no state |
| `DashboardPreviewMock.tsx` | server | static mini dashboard mockup |
| `ScrollFadeIn.tsx` | client | generic `IntersectionObserver` wrapper, reused by any section/card that fades in on scroll |
| `Features.tsx` | server | 6 static feature cards |
| `AiSection.tsx` | server | checklist + code mockup; tag "pop" is pure CSS (staggered `animation-delay`, no JS needed) |
| `CodeMockup.tsx` | server | static syntax-highlighted code block |
| `PricingSection.tsx` | client | monthly/yearly toggle state |
| `Cta.tsx` | server | static |
| `MarketingFooter.tsx` | server | `new Date().getFullYear()` computed server-side — no client JS needed for this, unlike the prototype's `script.js` |

`src/app/page.tsx` stays a server component: calls `auth()` to check session, composes the sections above, passes `isAuthenticated` down to the few components with CTA links.

## Fonts

The prototype loads Inter 600/700/800 for headings. Use the app's existing Geist Sans everywhere instead — no separate font load, headline stays visually consistent with the rest of the app instead of mixing two typefaces. Heading elements just use Tailwind's default `font-sans` (already Geist via `src/app/layout.tsx`) with `font-extrabold` (h1) / `font-bold` (h2/h3). No `src/lib/fonts.ts`, no `<link>` tag.

## Colors

Reuse `ITEM_TYPE_COLORS` from `src/lib/constants/icon-map.ts` for every accent that maps to a real item type — don't redefine them:

- Snippet blue, Prompt purple, Command orange, Note yellow, Link/URL green, File gray, Image pink

Two accents in the mockup have no matching item type (cyan for "Instant Search", green for checkmarks/"Save 25%" badge — same value as Link green but conceptually separate). Add these to a new `src/lib/constants/marketing.ts`:

```ts
export const MARKETING_ACCENT_COLORS = {
  search: "#06b6d4",
  success: "#10b981",
} as const;
```

Surfaces/text/borders use existing shadcn tokens instead of the prototype's custom `--bg`/`--bg-elevated`/`--bg-card`/`--text-secondary` variables: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`/`border-input`. Use `Card` from shadcn/ui for feature cards, pricing cards, and the code mockup where it fits instead of raw `div`s.

## Icons

Use `lucide-react` instead of inline SVGs wherever a direct equivalent exists — reuse `ICON_MAP` from `icon-map.ts` for item-type icons (`Code`, `Sparkles`, `Terminal`, `File`, `Link2`) plus `Search`, `Check`, `Menu`, `X`, `ArrowRight` for the rest.

Exception: the 11 chaos-panel logos (Notion, GitHub, Slack, VS Code, browser tabs, terminal, text file, bookmark, Figma, Docker, Trello, mail) are brand/literal glyphs, not generic UI icons — keep them as the inline SVGs from `prototypes/homepage/index.html`, moved into `ChaosAnimation.tsx` as a local icon list.

## Animations

- **Chaos icons** (`ChaosAnimation.tsx`): port the particle logic from `script.js` (lines 59–167) into a `useEffect` with `useRef` for the container and particle state, `requestAnimationFrame` loop, mouse move/leave listeners, resize listener — all cleaned up on unmount. Same physics constants (icon size 76px, repel radius/strength, max speed, drag).
- **Icon pulse / arrow pulse**: pure CSS keyframes (`@theme`/global CSS or Tailwind arbitrary properties), no JS — same as the prototype's `.chaos-icon-inner` and `.transform-arrow` rules, including the `--arrow-rotate` custom property trick so the mobile 90° rotation doesn't get clobbered by the pulse keyframes.
- **Scroll fade-in**: `ScrollFadeIn.tsx` client component wraps each section heading/card, uses `IntersectionObserver` (threshold 0.15) to add a "visible" state once, then unobserves — same behavior as `script.js`'s fade observer, just React-owned.
- **Navbar opacity**: scroll listener (`passive: true`) inside `MarketingNavbar.tsx`, toggles background/blur classes past a scroll threshold.
- **AI tag pop**: pure CSS, staggered via `nth-child` `animation-delay`, no JS.

## Links & Routes

All buttons/links must resolve to real routes — nothing left as `#` except in-page section anchors.

| Element | Unauthenticated | Authenticated |
|---|---|---|
| Navbar logo | `/` | `/` |
| Navbar "Features" / "Pricing" | `#features` / `#pricing` | same |
| Navbar "Sign In" | `/sign-in` | — (hidden) |
| Navbar "Get Started" | `/register` | replaced by a single "Dashboard" button → `/dashboard` |
| Hero "Get Started Free" | `/register` | `/dashboard` |
| Hero "See Features" | `#features` | `#features` |
| Pricing Free card CTA | `/register` | `/dashboard` |
| Pricing Pro card CTA | `/register` | `/dashboard` |
| Bottom CTA "Get Started Free" | `/register` | `/dashboard` |
| Footer "Features" / "Pricing" | `#features` / `#pricing` | same |

Determine `isAuthenticated` once in `page.tsx` via `auth()` and pass down as a prop — don't call `auth()` in multiple components.

Stripe checkout doesn't exist yet, so the Pro card CTA goes to `/register` like Free — leave a short comment noting it should point at checkout once billing is built (see `project-overview.md` — Pro tier is unpaid during development).

The prototype's footer link columns (Changelog, About, Blog, Contact, Privacy, Terms) point at pages that don't exist in the app. Drop those from the footer — keep only Features and Pricing (in-page anchors) plus the copyright line, so every link that ships actually goes somewhere.

## Out of Scope

- No new pages beyond editing `src/app/page.tsx` and adding `src/components/marketing/*`
- No Stripe/checkout wiring for the Pro CTA
- No automated browser testing — verify manually in the browser like the rest of the app

## References

- `prototypes/homepage/index.html`, `styles.css`, `script.js` — source of truth for markup, styling and animation logic
- `context/features/homepage-mockup-spec.md` — original prototype spec
- `src/lib/constants/icon-map.ts` — `ITEM_TYPE_COLORS`, `ICON_MAP`
- `src/proxy.ts` — confirms `/` is unprotected
- `src/app/layout.tsx` — existing font setup, dark mode default
- `context/coding-standards.md`
