# Current Feature

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

### 2026-04-08 — Initial Next.js & Tailwind Setup

- Created Next.js project with Tailwind CSS v4
- Removed default Next.js boilerplate (SVGs, demo page content)
- Added `CLAUDE.md` and `context/` directory with project documentation
- Pushed to GitHub: https://github.com/Technohunter96/devstash.git

### 2026-04-09 — Dashboard UI Phase 1 Completed

- Initialized ShadCN UI with Button and Input components
- Created dashboard route at `/dashboard` with layout
- Dark mode set as default (`dark` class on `html`)
- TopBar with DevStash logo/title, centered search (Ctrl+K shortcut), and New Item button
- Placeholder sidebar and main area

### 2026-04-09 — Dashboard UI Phase 2 Completed

- Collapsible sidebar (icon-only when collapsed on desktop, overlay drawer on mobile)
- Item type links to `/items/TYPE` with color-coded icons, counts, and PRO badge
- Collections section collapsible as a whole, with Favourites and All Collections subsections
- Favourite collections show star icon + item count; All Collections indented with item count
- User avatar area at bottom with name, email, and settings icon
- Mobile hamburger button in TopBar to open sidebar drawer
- New Collection button moved to TopBar (outline style) beside New Item
- Buttons icon-only on mobile (`sm:` breakpoint)
- TopBar background changed to `bg-background` for visual consistency

### 2026-04-09 — Dashboard UI Phase 3 Completed

- 4 stats cards (total items, collections, favourite items/collections) using Card component
- Collections section with item type icons, sorted by updatedAt, View all link
- Pinned Items section
- Recent Items section sorted by lastUsedAt, View all link
- CollectionCard as standalone `"use client"` component with `router.push`
- ItemCard as `"use client"` with hover copy button, prepared for `useItemDrawer` context
- Collections, Items, PinnedItems, StatsCards as server components
- shadcn Card component installed
- Mock data extended with `itemTypes` per collection and `isPinned` on 2 items

### 2026-04-14 — Neon PostgreSQL + Prisma 7 Setup Completed

- Upgraded Node.js to v24.14.1 (Prisma 7 requires 20.19+)
- Installed Prisma 7 with `@prisma/adapter-neon` and `@neondatabase/serverless`
- Schema with all models: User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models
- All tables and columns use snake_case via `@@map` / `@map`
- `prisma.config.ts` for datasource URL and seed command (Prisma 7 requirement)
- `src/lib/prisma.ts` singleton using `PrismaNeon` driver adapter
- `prisma/seed.ts` for system item types
- 2 migrations: `init` + `snake_case_column_names`
- `src/generated/` added to `.gitignore`

### 2026-04-14 — Seed Data Completed

- Added `password` field to User model with migration
- Demo user: `demo@devstash.io`, bcryptjs 12 rounds
- 7 system item types seeded
- 5 collections with 16 items total:
  - React Patterns: 3 snippets (custom hooks, component patterns, utils)
  - AI Workflows: 3 prompts (code review, docs generation, refactoring)
  - DevOps: 1 snippet, 1 command, 2 links
  - Terminal Commands: 4 commands (git, docker, process, npm)
  - Design Resources: 4 links (Tailwind, shadcn, Radix, Lucide)
- Seed is idempotent — skips existing records

### 2026-04-17 — Dashboard Collections — Real Data Completed

- Created `src/lib/db/collections.ts` with `getRecentCollections(userId, limit)` function
- Collections fetched from Neon DB via Prisma — includes item types and item count per collection
- Dominant color computed from most-used item type in each collection (application layer, no DB change)
- `CollectionCard` updated with `border-l-[3px]` accent using dominant color via inline style
- Dashboard page made `async` — queries demo user by email, passes real collections to components
- Collection stats (`totalCollections`, `favoriteCollections`) now derived from real DB data

### 2026-04-17 — Stats & Sidebar — Real Data Completed

- Created `src/lib/db/sidebar.ts` with `getSidebarItemTypes` and `getSidebarCollections` functions
- `getSidebarItemTypes` fetches system item types from DB with per-user item counts; File/Image sorted to bottom
- `getSidebarCollections` fetches collections ordered by favourite first, then updatedAt; includes dominant color
- Created `src/components/dashboard/DashboardShell.tsx` — client shell with sidebar open/collapsed state
- `layout.tsx` converted to async server component — fetches sidebar data, renders DashboardShell
- `Sidebar.tsx` updated to accept real data as props, removed mock data dependency
- Non-favourite collections show colored circle based on dominant item type instead of folder icon
- "View all collections →" link added below collections list
- Favourites and Recents sections aligned (same left indent, bigger gap between sections)

### 2026-04-17 — Dashboard Items — Real Data Completed

- Created `src/lib/db/items.ts` with `getPinnedItems`, `getRecentItems`, `getItemStats` functions
- Dashboard page updated — all data fetched from Neon DB via `Promise.all`, mock data removed
- Pinned Items section hidden when no pinned items exist
- Stats cards (Total Items, Favourite Items) now use real DB counts
- Items layout changed from 3-column grid to full-width list
- "Items" section renamed to "Recent" with clock icon; "Pinned" section has pin icon
- ItemCard: time ago displayed top-right, favourite star shown next to title when `isFavorite = true`
- Seed updated with `lastUsedAt` values per item (minutes/hours/days ago) and `isFavorite` support

### 2026-04-26 — Add Pro Badge to Sidebar Completed

- Installed ShadCN UI Badge component (`src/components/ui/badge.tsx`)
- Replaced custom PRO `<span>` in `Sidebar.tsx` with `<Badge variant="secondary">`
- Badge displayed immediately after item name (File, Image) with count pushed to the right

### 2026-04-26 — Code Review Quick Wins Completed

- Root `/` redirects to `/dashboard` instead of rendering bare `<h1>`
- `DATABASE_URL` explicit runtime throw in `src/lib/prisma.ts`; removed localhost fallback in `prisma.config.ts`
- `timeAgo` extracted to `src/lib/utils.ts` (removed from `ItemCard.tsx`)
- Shared `ICON_MAP` extracted to `src/lib/icon-map.ts` — removed 3 duplicate definitions across `ItemCard.tsx`, `CollectionCard.tsx`, `Sidebar.tsx`
- `getSidebarItemTypes` N+1 fixed: replaced item-ID `include` with `_count` aggregate
- `getCollectionStats()` added to `collections.ts` — `totalCollections`/`favoriteCollections` now from dedicated DB counts, not limited fetch
- 6 performance indexes added via Prisma migration `20260426121420_add_performance_indexes`: composite indexes on `Item (userId+lastUsedAt, userId+isPinned, userId+isFavorite)`, `Collection (userId+updatedAt, userId+isFavorite+updatedAt)`, `ItemCollection (collectionId)`
- `loading.tsx` skeleton and `error.tsx` boundary added for `/dashboard` route; `skeleton` shadcn component installed
- Sidebar collapse button: `cursor-pointer` + `PanelLeftClose`/`PanelLeftOpen` Lucide icons
- code-scanner agent extended with `### 4. Database Schema` and `### 5. Next.js Route Completeness` audit sections

### 2026-04-30 — Auth Setup — NextAuth + GitHub Provider Completed

- Installed `next-auth@beta` and `@auth/prisma-adapter`
- Created `src/auth.config.ts` — edge-compatible config with GitHub provider only
- Created `src/auth.ts` — PrismaAdapter, JWT session strategy, `user.id` populated via session callback
- Created `src/app/api/auth/[...nextauth]/route.ts` — GET/POST handlers exported from auth.ts
- Created `src/proxy.ts` — named export protecting `/dashboard/:path*` routes, redirects unauthenticated to sign-in
- Created `src/types/next-auth.d.ts` — extends `Session` type with `user.id`

### 2026-05-01 — Auth Credentials — Email/Password Provider Completed

- Updated `src/auth.config.ts` — added Credentials provider with `authorize: () => null` placeholder (edge runtime neumí bcrypt)
- Updated `src/auth.ts` — plný Credentials provider s `bcrypt.compare` validací a DB lookupem uživatele
- Created `src/app/api/auth/register/route.ts` — POST endpoint pro registraci: validace polí, kontrola duplicit, bcrypt hash (12 rounds), vytvoření uživatele