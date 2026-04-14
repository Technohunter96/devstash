# Current Feature

Neon PostgreSQL + Prisma Setup

# Status

Completed

## Requirements

- Use Neon PostgreSQL (serverless) as the database
- Set up Prisma 7 ORM (note: has breaking changes vs v6)
- Create initial schema based on data models in `project-overview.md`
- Include NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Use `DATABASE_URL` for development branch, separate production branch
- Always create migrations (`prisma migrate dev`) — never `db push`

## References

- `context/features/database-spec.md`
- `context/project-overview.md`
- Prisma 7 upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Prisma quickstart: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres

---

# Previous Feature

Dashboard UI Phase 3 — Main Area Content

# Status

Completed

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
