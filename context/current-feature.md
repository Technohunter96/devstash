# Current Feature

# Status

## Goals

## Notes

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
