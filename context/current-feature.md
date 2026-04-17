# Current Feature

<!-- Feature Name -->

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

### 2026-04-17 — Dashboard Collections — Real Data Completed
- Created `src/lib/db/collections.ts` with `getRecentCollections(userId, limit)` function
- Collections fetched from Neon DB via Prisma — includes item types and item count per collection
- Dominant color computed from most-used item type in each collection (application layer, no DB change)
- `CollectionCard` updated with `border-l-[3px]` accent using dominant color via inline style
- Dashboard page made `async` — queries demo user by email, passes real collections to components
- Collection stats (`totalCollections`, `favoriteCollections`) now derived from real DB data

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
