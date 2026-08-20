# Current Feature

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- What does success look like? -->

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

### 2026-05-01 — Auth UI — Sign In, Register & Sign Out Completed

- Created `src/app/sign-in/page.tsx` — server component with `Suspense` wrapper
- Created `src/components/auth/sign-in-form.tsx` — client form with email/password, GitHub OAuth button, error display
- Created `src/app/register/page.tsx` — server component
- Created `src/components/auth/register-form.tsx` — client form with name/email/password/confirm, validation, redirect to sign-in on success
- Created `src/components/ui/user-avatar.tsx` — reusable avatar: GitHub image or initials fallback
- Created `src/components/icons/github-icon.tsx` — standalone GitHub SVG icon component
- Updated `Sidebar.tsx` — real session user in bottom area, avatar with initials/image, dropdown with Profile link and red Sign out button
- Updated `layout.tsx` — fetches user from session via `auth()` instead of hardcoded demo email
- Updated `auth.ts` — added `pages: { signIn: "/sign-in" }`; `auth.config.ts` — removed redundant `pages` (middleware redirects manually)
- Updated `proxy.ts` — redirects unauthenticated users to `/sign-in`
- Updated `next.config.ts` — added `avatars.githubusercontent.com` to `remotePatterns` for `next/image`
- Added `cursor-pointer` to `Button` component globally; same added to custom plain buttons in sidebar
- Updated `coding-standards.md` — pages must be server components, `cursor-pointer` required on all interactive elements

### 2026-05-07 — Email Verification on Register Completed

- Installed Resend SDK; created `src/lib/resend.ts`, `src/lib/tokens.ts`, `src/lib/email.ts` (styled HTML template)
- Updated register route — generates token, sends verification email (graceful fallback on send failure)
- Added `POST /api/auth/resend-verification` — resends email for unverified accounts
- Created `(auth)` route group with shared layout; moved all auth pages into it (sign-in, register, verify-email, verify-email-sent)
- Created `/verify-email` — validates token, sets `emailVerified`, redirects to `/email-verified`
- Created `/email-verified` — success page with Sign in button
- Created `/verify-email-sent` — shows email address, inline "resend email" link (`ResendVerificationButton`)
- Updated `auth.ts` — jwt callback reads `emailVerified` from DB; session exposes it
- Updated `proxy.ts` — edge-compatible using `authConfig`; added `callbackUrl` on redirect
- Updated `dashboard/layout.tsx` — redirects unverified users to `/verify-email-sent?email=...`
- `RESEND_TEST_EMAIL` in `.env` for local dev (Resend sandbox restriction — replace `from` with verified domain before launch)

### 2026-05-07 — Email Verification Toggle Completed

- Created `src/lib/feature-flags.ts` with `isEmailVerificationEnabled()` — reads `EMAIL_VERIFICATION_ENABLED` env var, defaults to `false`
- Register route: when disabled, sets `emailVerified: new Date()` on user create and skips token/email logic
- `dashboard/layout.tsx`: unverified redirect wrapped in `isEmailVerificationEnabled()` check
- Removed `RESEND_TEST_EMAIL` workaround from `src/lib/email.ts` and `.env` — no longer needed
- Added `EMAIL_VERIFICATION_ENABLED=false` to `.env` and `.env.example`

### 2026-05-08 — Forgot Password Completed

- Refactored `src/lib/tokens.ts` — shared `createToken(identifier, ttlMs)` helper; added `createPasswordResetToken` (1h TTL, `password-reset:` identifier prefix) and helper functions `isPasswordResetToken`, `emailFromPasswordResetIdentifier`
- Added `sendPasswordResetEmail` to `src/lib/email.ts` with matching HTML template
- Created `POST /api/auth/forgot-password` — generates token, sends email; always returns 200 (no account enumeration); only processes accounts with `password` set (Credentials only)
- Created `POST /api/auth/reset-password` — validates token prefix + expiry, updates password (bcrypt 12 rounds), deletes token (single-use); returns descriptive 400 on invalid/expired token
- Created `/forgot-password` page + `ForgotPasswordForm` — email input with in-form success state
- Created `/reset-password` page + `ResetPasswordForm` — new password + confirm, validates client-side, redirects to `/sign-in?reset=1` on success
- Updated `sign-in-form.tsx` — `Forgot password?` link right-aligned under password field; success message on `?reset=1`; GitHub button as small icon-only at bottom; `Register` link moved to very bottom

### 2026-05-08 — Profile Page Completed

- Created `/profile` route — `src/app/profile/layout.tsx` (auth + email verification check + DashboardShell) and `src/app/profile/page.tsx` (server component)
- `AccountInfoCard` — avatar, name, account type (Email/GitHub), email + member since with icons, separator, action buttons
- `ChangePasswordDialog` — inline dialog with current/new/confirm fields, eye toggle on all fields, same-password validation (client + server), success toast via Sonner
- `DeleteAccountDialog` — AlertDialog confirmation, redirects to `/sign-in` on success
- `ProfileStats` — two stat cards (Total Items, Collections) with colored icon squares; Items by Type grid showing all 7 system types (including 0-count), sorted by system order
- `POST /api/auth/change-password` — validates current password, same-password check, bcrypt 12 rounds
- `DELETE /api/auth/delete-account` — session-guarded, cascade delete via Prisma
- `src/lib/db/profile.ts` — `getProfileUser` (hasPassword flag), `getProfileStats` (all system types merged with user counts)
- Installed shadcn AlertDialog, Dialog, Label, Sonner; `<Toaster>` added to root layout (`top-right`, `richColors`)
- `sign-in-form.tsx` — toasts for `?reset=1` (password updated) and `?error=InvalidToken` (invalid verification link); strips query params via `router.replace` after firing
- `proxy.ts` — added `/profile` and `/profile/:path*` to middleware matcher

### 2026-05-08 — Rate Limiting for Auth Completed

- Created `src/lib/rate-limit.ts` — lazy Redis singleton, `checkRateLimit(type, identifier)`, `rateLimitResponse()`, `formatRetryTime()` helpers; fail open if Upstash unavailable
- Added `POST /api/auth/login-ratelimit` — IP-only pre-check (5 attempts / 15 min); prevents account lockout attacks from email enumeration
- Protected `register` (3/1h), `forgot-password` (3/1h), `reset-password` (5/15min), `resend-verification` (3/15min by IP+email) — all return 429 with `Retry-After` header and formatted retry time
- `sign-in-form.tsx` calls `/api/auth/login-ratelimit` before `signIn()`; shows descriptive error with retry time on 429
- `forgot-password-form.tsx` and `resend-verification-button.tsx` updated to display API error message instead of hardcoded fallback
- Collapsed sidebar user menu fixed: icon-only dropdown (`User`, `LogOut`) positioned `left-full` outside the 60px sidebar

### 2026-05-09 — Items List View Completed

- Created dynamic route `/items/[type]` (snippets, prompts, commands, notes, links, files, images)
- `src/app/items/[type]/layout.tsx` — auth-guarded layout with DashboardShell (same pattern as profile)
- `src/app/items/[type]/page.tsx` — server component: slug → type name resolution, `notFound()` for unknown slugs, two-column grid on `md+`
- `SLUG_TO_TYPE_NAME` map and `getItemsByType(userId, typeName)` added to `src/lib/db/items.ts`
- `/items/:path*` added to `proxy.ts` middleware matcher
- DevStash logo in TopBar wrapped in `<Link href="/dashboard">` for navigation back
- `description` field added to `DashboardItem` interface, `itemSelect`, and all 16 seed items
- `lastUsedAt @default(now())` added to schema via migration — new items always have a timestamp
- ItemCard redesigned: description below title, type name + icon as fixed-width (`w-12`) left column, badge removed from text area
- Card gap increased: `gap-3` in dashboard lists, `gap-4` on items page grid

### 2026-05-11 — Three-Column Item Grid Completed

- `/items/[type]` page grid updated from `md:grid-cols-2` to `md:grid-cols-2 lg:grid-cols-3`
- Responsive breakpoints: 1 column (mobile) → 2 columns (md, 768px+) → 3 columns (lg, 1024px+)
- Dashboard lists unchanged

### 2026-05-18 — Item Drawer Completed

- Installed shadcn Sheet component (`src/components/ui/sheet.tsx`)
- `getItemById(userId, itemId)` added to `src/lib/db/items.ts` — full item detail with tags and flattened collections (defaultType color)
- `GET /api/items/[id]` route with `auth()` guard and userId scoping (no IDOR)
- `ItemDrawerProvider` + `useItemDrawer()` context in `src/components/dashboard/ItemDrawerProvider.tsx` — manages open state, fetch, race condition guard via `requestIdRef`
- `ItemDrawer` component in `src/components/dashboard/ItemDrawer.tsx` — skeleton/error/body states; action bar (Favorite yellow, Pin blue, Copy functional, Edit, Delete right-aligned); sections: Description, Content (monospace block), URL (styled link card with type color), Tags, Collections
- `DashboardShell` wraps children in `ItemDrawerProvider` — drawer works on both `/dashboard` and `/items/[type]`
- `ItemCard` wired: `onClick={() => open(item.id)}`, copy button retains `e.stopPropagation()`
- Drawer width: `data-[side=right]:w-1/3` to correctly override base Sheet CSS specificity
- 6 unit tests for `getItemById` collection transformation (`src/lib/db/items.test.ts`)

### 2026-06-14 — Item Drawer Edit Mode Completed

- Edit button in action bar switches drawer to inline edit mode (same drawer, no navigation)
- Action bar replaced by Save and Cancel buttons in edit mode
- Editable fields for all types: Title (required), Description, Tags (comma-separated)
- Type-specific fields: Content (Snippet/Prompt/Command/Note), Language (Snippet/Command), URL (Link)
- Non-editable: item type, collections, created/updated dates
- `updateItem(itemId, data)` server action in `src/actions/items.ts` — Zod validation, `auth()` + ownership check, `{ success, data, error }` pattern
- `updateItemById(userId, itemId, data)` in `src/lib/db/items.ts` — tag handling: disconnect all + connect-or-create
- Save returns updated `ItemDetail` — drawer refreshes without a second fetch; `router.refresh()` updates cards in background
- Disable Save when title is empty (client-side guard)
- Cancel discards changes and returns to view mode
- Success and error toasts via Sonner
- 10 unit tests for `updateItem` in `src/actions/items.test.ts`

### 2026-06-14 — Item Delete Functionality Completed

- Delete button in item drawer action bar opens `ItemDeleteDialog` (shadcn AlertDialog)
- Dialog displays item title to prevent accidental deletion
- `deleteItem(itemId)` server action in `src/actions/items.ts` — `auth()` + ownership check, `{ success, error }` pattern
- `deleteItemById(userId, itemId)` in `src/lib/db/items.ts` — atomic `deleteMany` with userId scope (no IDOR, no race condition)
- `ItemDeleteDialog` extracted as standalone component (`src/components/dashboard/ItemDeleteDialog.tsx`) with 5 props
- `handleItemDeleted` in `ItemDrawerProvider` — invalidates in-flight fetch, resets drawer state, calls `router.refresh()`
- Success and error toasts via Sonner; spinner on Delete button during deletion
- 5 unit tests for `deleteItem` in `src/actions/items.test.ts`

### 2026-06-14 — Item Create Completed

- "New Item" button in TopBar opens `NewItemDialog` — self-contained component, owns its own trigger button
- Type selector: 5-column grid (Snippet, Prompt, Command, Note, Link); File/Image excluded (Pro)
- Conditional fields: Content for Snippet/Prompt/Command/Note; Language for Snippet/Command; URL for Link
- All types: Title (required), Description, Tags (comma-separated)
- `createItem(data)` server action in `src/actions/items.ts` — `CreateItemSchema` Zod validation, `auth()` + userId, `{ success, data, error }` pattern
- `createItemInDb(userId, data)` in `src/lib/db/items.ts` — `findFirstOrThrow` for ItemType, `connectOrCreate` tags, returns `ItemDetail` with empty collections
- On success: dialog closes + resets to `DEFAULT_STATE`, `router.refresh()`, success toast
- On error: error toast, dialog stays open
- `canSave` guard: title non-empty AND (not Link OR url non-empty)
- 9 unit tests for `createItem` in `src/actions/items.test.ts`

### 2026-06-15 — Code Editor Completed

- Installed `@monaco-editor/react`; created `src/components/dashboard/CodeEditor.tsx` with Monaco Editor (`vs-dark` theme)
- macOS window dots (red/yellow/green) + language label + copy button in editor header
- Fluid height: auto-adjusts 80–400px via `onDidContentSizeChange`; dark 6px scrollbar, no shadows
- `ItemDrawer.tsx` — Snippet/Command view mode uses `<CodeEditor readOnly>` instead of `<pre>`; edit mode uses `<CodeEditor onChange>` instead of `<textarea>`; Prompt/Note keep `<pre>`/`<textarea>`
- `NewItemDialog.tsx` — refactored: dialog logic extracted into exported `NewItemDialogContent` (controlled via `open`/`onOpenChange`/`defaultTypeName`); Snippet/Command content field uses `CodeEditor`; default export stays as self-contained TopBar button
- Created `src/components/dashboard/AddTypeItemButton.tsx` — client component receiving `typeName` and `color` as plain string props; colored outline button opens `NewItemDialogContent` with type pre-selected
- `/items/[type]/page.tsx` — header row with `AddTypeItemButton` for creatable types (Snippet/Prompt/Command/Note/Link); File/Image pages show no button; type colors defined inline (no client module import)

### 2026-06-21 — Markdown Editor Completed

- Installed `react-markdown` + `remark-gfm` for GitHub Flavored Markdown rendering
- Created `src/components/dashboard/MarkdownEditor.tsx` — macOS header (same style as CodeEditor), Write/Preview tabs, `useEffect` ref-based auto-resize textarea (min 400px, grows unbounded), Preview renders `react-markdown` with `.markdown-preview` CSS class; readonly mode shows Preview tab only
- Added `.markdown-preview` CSS to `globals.css` — styled via `@apply` + CSS vars (theme-aware: `text-foreground`, `bg-muted`, `border-border`); code blocks inside markdown hardcoded dark (`#1e1e1e`) intentionally
- `ItemDrawer.tsx` — Prompt/Note content uses `MarkdownEditor` in both view and edit mode; description textarea gets `ref`-based auto-resize (`[editState.description, isEditMode]` deps — `isEditMode` dep ensures resize fires on edit mode entry); content section rewritten as clean ternary (`isCodeType ? … : isMarkdownType ? … : null`) without dead fallbacks
- `NewItemDialog.tsx` — Prompt/Note content field uses `MarkdownEditor`; dead fallback `<textarea>` removed from content section
- `CodeEditor.tsx` — `minHeight` now depends on `readOnly` prop: 80px (view) / 400px (edit); both cap at 400px via `onDidContentSizeChange`
- `src/lib/icon-map.ts` — added `ITEM_TYPE_COLORS` as single source of truth for all 7 system type colors
- `NewItemDialog`, `items/[type]/page`, `StatsCards`, `ProfileStats` — all hardcoded item type hex colors replaced with `ITEM_TYPE_COLORS` references

### 2026-06-24 — File & Image Upload with Cloudflare R2 Completed

- Installed `@aws-sdk/client-s3`; created `src/lib/r2.ts` — R2 client with `uploadToR2`, `deleteFromR2`, `validateFile`, `generateR2Key`; exports `UPLOAD_CONSTRAINTS` (Image: 5 MB, File: 10 MB) with allowed MIME types and extensions
- Created `POST /api/upload` — auth-guarded multipart upload, server-side validation, returns `{ fileUrl, fileName, fileSize }`
- Created `GET /api/files/[id]` — download proxy, streams file from R2 with `Content-Disposition: attachment` header, auth + userId scoping
- Created `src/components/dashboard/FileUpload.tsx` — drag-and-drop with click-to-browse, XHR upload progress bar, image thumbnail or file info preview, remove button; accepts `typeName` for constraint selection
- `NewItemDialog.tsx` — File/Image added to type selector (7 types, `grid-cols-4 sm:grid-cols-7`); `FileUpload` shown for file types instead of content editor; `canSave` requires uploaded file; `transition-all duration-200` for smooth type switching; scrollable body `max-h-[70vh]`
- `src/actions/items.ts` — File/Image added to `CREATABLE_TYPE_NAMES`; `CreateItemSchema` extended with `fileUrl`, `fileName`, `fileSize`; `deleteItem` calls `deleteFromR2` for R2 cleanup (best-effort)
- `src/lib/db/items.ts` — `CreateItemData` extended with file fields; `createItemInDb` sets `contentType: FILE` for File/Image types; `deleteItemById` returns `{ deleted, fileUrl }` for R2 cleanup
- `ItemDrawer.tsx` — image preview (`<img>` with `object-contain`, max 400px) for Image type; file info card (icon, name, size) for File type; download button (icon-only) next to delete; edit mode shows `FileUpload` for file replacement
- `CodeEditor.tsx` — `minHeight` changed from `readOnly ? 80 : 400` to flat `80` for all modes
- `MarkdownEditor.tsx` — Write tab unified with Preview: `minHeight: 80`, `maxHeight: 400`, `overflowY: auto`
- 16 unit tests for `validateFile` and `generateR2Key` in `src/lib/r2.test.ts`
- Existing `deleteItem` tests updated for new `{ deleted, fileUrl }` return type

### 2026-07-22 — Image Gallery View Completed

- Created `src/components/dashboard/ImageCard.tsx` — thumbnail card with `aspect-video`, `object-cover`, hover zoom (5% scale / 300ms), always-visible title overlay (`bg-black/75`), pin and favourite badges top-right, placeholder icon when `fileUrl` is null
- `DashboardItem` interface and `itemSelect` in `src/lib/db/items.ts` extended with `fileUrl`
- `/items/[type]/page.tsx` — renders `ImageCard` instead of `ItemCard` when `typeName === "Image"`; other types unchanged
- `ItemDrawer.tsx` — image preview clickable to open fullscreen lightbox (black backdrop, X to close); download link moved below image preview and alongside file card; Details section added at bottom showing created/updated dates
- `ItemCard.tsx` — title font size changed from `text-sm` to `text-base`

### 2026-07-23 — File List View Completed

- Created `src/components/dashboard/FileListItem.tsx` — single-column list row with file type icon (by extension: image/code/archive/document/generic), title, original filename, size, upload date, download button (`stopPropagation`); info columns hidden on mobile
- `DashboardItem` interface and `itemSelect` extended with `fileName`, `fileSize`, `createdAt`
- `/items/[type]/page.tsx` — renders `FileListItem` list (`flex-col gap-2`) for File type; Image and other types unchanged
- `ITEM_TYPE_COLORS["File"]` updated from `#6b7280` to `#9ca3af` — lighter grey, visually distinct from disabled state on dark background

### 2026-08-05 — Collection Create Completed

- Created `src/actions/collections.ts` — `createCollection` server action; `CreateCollectionSchema` Zod validation (name required, description optional), `auth()` + userId, `{ success, data, error }` pattern — mirrors `createItem` in `items.ts`
- `createCollectionInDb(userId, data)` added to `src/lib/db/collections.ts` — returns `DashboardCollection` with `itemCount: 0`, empty `itemTypes`, `dominantColor: null` for the new collection
- Created `src/components/dashboard/NewCollectionDialog.tsx` — modal with Name (required) and Description fields; exported `NewCollectionDialogContent` (controlled) plus self-contained default export for the TopBar button, same structure as `NewItemDialog`
- `TopBar.tsx` — replaced static "New Collection" placeholder button with `<NewCollectionDialog />`
- On success: dialog closes + resets, `router.refresh()`, success toast; on error: error toast, dialog stays open
- 8 unit tests for `createCollection` in `src/actions/collections.test.ts`

### 2026-08-05 — Add Item to Collections Completed

- `getCollectionOptions(userId)` added to `src/lib/db/collections.ts` — collection list with dominant color per collection; `GET /api/collections` exposes it to client components
- Created `src/components/dashboard/CollectionMultiSelect.tsx` — click-to-toggle selector (no checkboxes); trigger shows selected collections as inline badges, dropdown rows show a colored dot instead of a folder icon
- Created `src/components/dashboard/CollectionBadge.tsx` — shared badge (colored dot + name), used by `CollectionMultiSelect` and `ItemDrawer` read-only view, so both stay visually identical
- `createItem`/`updateItem` server actions in `src/actions/items.ts` — `collectionIds: string[]` added to both Zod schemas, defaults to `[]`
- `src/lib/db/items.ts` — `getOwnedCollectionIds` guards against IDOR by filtering to collections owned by the requesting user; `createItemInDb` connects collections on create, `updateItemById` replaces the full set in a transaction (`itemCollection.deleteMany` + `createMany`)
- Fixed a pre-existing bug where collection color always read `collection.defaultType.color` (a field never actually set anywhere) and was always `null`; `getDominantColors` exported from `collections.ts` (built on a shared `getItemTypeCountsByCollection` helper also used by `getRecentCollections`) is now the single source of truth for collection color, used by `getItemById`, `createItemInDb`, and `updateItemById`
- `NewItemDialogContent` — fixed header/footer (Cancel/Create no longer scroll out of view), only the field list scrolls, `max-h-[85vh]`
- `ItemCard.tsx` — tags now shown as badges at the bottom of the card
- Tests: 9 new tests in `src/lib/db/collections.test.ts` (`getDominantColors`, `getCollectionOptions`); `src/lib/db/items.test.ts` updated to mock `getDominantColors`; 4 new tests in `src/actions/items.test.ts` for `collectionIds` passthrough/defaults

### 2026-08-06 — Collections List & Detail Pages Completed

- `src/lib/db/collections.ts` — added `getAllCollections(userId)` (all collections, no limit, sorted by name) and `getCollectionDetail(userId, collectionId)` (ownership-scoped, returns `null` on IDOR/not found); `getRecentCollections`'s row-shaping logic extracted into shared `withDominantColorInfo` helper reused by both
- `src/lib/db/items.ts` — added `getItemsByCollection(userId, collectionId)`, scoped by userId and collection membership
- Created `src/app/collections/layout.tsx` — auth-guarded `DashboardShell` wrapper, same pattern as `/items/[type]` and `/profile`
- Created `src/app/collections/page.tsx` — grid of all collections using existing `CollectionCard`
- Created `src/app/collections/[id]/page.tsx` — collection detail (name, description, favorite star, item count); items split by type and rendered with existing `ItemCard`/`ImageCard`/`FileListItem`; `notFound()` on missing/unowned collection
- `proxy.ts` — added `/collections` and `/collections/:path*` to middleware matcher
- Sidebar's "View all collections" link and `CollectionCard`'s click-through already pointed at `/collections`/`/collections/[id]` from earlier work — no changes needed there, only the target pages were missing
- Tests: 7 new tests in `src/lib/db/collections.test.ts` (`getAllCollections`, `getCollectionDetail`); 2 new tests in `src/lib/db/items.test.ts` (`getItemsByCollection`)

### 2026-08-06 — Collection Management — Edit, Delete & Favorite Completed

- Installed shadcn DropdownMenu (Base UI-backed) and Textarea components
- `updateCollectionInDb(userId, collectionId, data)` and `deleteCollectionInDb(userId, collectionId)` added to `src/lib/db/collections.ts` — both ownership-scoped; delete uses `deleteMany` (IDOR-safe); update uses `withDominantColorInfo` to return a full `DashboardCollection`
- `updateCollection` and `deleteCollection` server actions added to `src/actions/collections.ts` — Zod validation, `auth()` guard, `{ success, data/error }` pattern
- Created `src/components/dashboard/CollectionEditDialog.tsx` — Dialog modal for editing name + description; resets from props on open; Save disabled when name empty
- Created `src/components/dashboard/CollectionDeleteDialog.tsx` — AlertDialog confirmation; clarifies items are NOT deleted; optional `onDeleted` callback for post-delete navigation
- Created `src/components/dashboard/CollectionDetailActions.tsx` — client component with Edit/Delete/Favorite buttons for the `/collections/[id]` header; Delete redirects to `/collections` on success
- `CollectionCard.tsx` — added 3-dot `DropdownMenu` (Edit, Favorite disabled, Delete); menu uses `onClick` (Base UI API, not Radix `onSelect`); trigger `stopPropagation` so card navigation still fires on the rest of the card; `CollectionEditDialog` + `CollectionDeleteDialog` rendered in the fragment
- `/collections/[id]/page.tsx` — header row updated with `CollectionDetailActions`; favorite star removed from header (now in actions component)
- 10 new tests in `src/actions/collections.test.ts` for `updateCollection` (6) and `deleteCollection` (4)

### 2026-08-10 — Global Search / Command Palette Completed

- Installed shadcn Command component (`src/components/ui/command.tsx`, `input-group.tsx`) — cmdk-backed
- Created `src/lib/db/search.ts` — `getSearchItems`/`getSearchCollections`, lightweight fields only (id, title, description, type, content preview / item count + dominant color)
- Created `src/actions/search.ts` — `getSearchData()` Server Action combining both queries; established as the pattern for client-side data reads going forward (see coding-standards.md update below)
- Created `src/components/dashboard/SearchProvider.tsx` — context holding palette open state; global Cmd+K/Ctrl+K listener; lazy fetch (data loads on first open, not on app load)
- Created `src/components/dashboard/CommandPalette.tsx` — two `CommandGroup`s (Items/Collections) separated by `CommandSeparator`; fuzzy match on title via `value`, fuzzy match on description via `keywords`; description shown under title in results; item select opens `ItemDrawer`, collection select navigates to `/collections/[id]`; palette positioned `top-[15%]` (Linear/VS Code style, not centered)
- `DashboardShell.tsx` — wraps children in `SearchProvider`, renders `CommandPalette`
- `TopBar.tsx` — search input replaced with a button styled as an input; click opens the palette; `⌘K`/`Ctrl+K` hint kept in the trailing kbd badge; old local Ctrl+K listener removed (now global in `SearchProvider`)
- `coding-standards.md` — clarified Server Actions vs API routes: client-side reads use Server Actions; API routes reserved for cases needing `AbortController`-based cancellation (race condition guards) among other existing exceptions
- 12 unit tests: `src/lib/db/search.test.ts` (8), `src/actions/search.test.ts` (4)

### 2026-08-11 — Pagination Completed

- Created `src/lib/constants/pagination.ts` — `ITEMS_PER_PAGE` (15), `COLLECTIONS_PER_PAGE` (21), `DASHBOARD_COLLECTIONS_LIMIT` (6), `DASHBOARD_RECENT_ITEMS_LIMIT` (5); establishes `src/lib/constants/<feature>.ts` as the pattern for feature-scoped constants going forward
- Moved `src/lib/icon-map.ts` to `src/lib/constants/icon-map.ts` to match the new convention; all importers updated
- Created `src/types/pagination.ts` — `PaginatedResult<T>` (`data` + `totalCount`)
- Added `parsePage` to `src/lib/utils.ts` — parses a `?page=` search param into a valid positive integer, defaulting to 1 on missing/invalid/negative/decimal input; guards Prisma's `skip` from going negative
- `getItemsByType`/`getItemsByCollection` (`src/lib/db/items.ts`) and `getAllCollections` (`src/lib/db/collections.ts`) now paginate via `skip`/`take` plus a parallel `count`, returning `PaginatedResult` instead of the full list
- `getRecentItems`/`getRecentCollections` default limits now reference `DASHBOARD_RECENT_ITEMS_LIMIT`/`DASHBOARD_COLLECTIONS_LIMIT` instead of hardcoded numbers — same dashboard behavior, no new call sites
- Created `src/components/dashboard/Pagination.tsx` — server component (no client JS) rendering numbered page links plus prev/next via `next/link`; long ranges collapse into an ellipsis; disabled prev/next render as non-interactive greyed-out spans instead of links
- Wired into `/items/[type]`, `/collections/[id]`, and `/collections` — each reads `page` from `searchParams` via `parsePage`, passes it to the paginated query, and renders `<Pagination>` at the bottom
- `/collections` wasn't explicitly named in the original spec's page list (only `COLLECTIONS_PER_PAGE` hinted at it) — confirmed in scope with the user before implementing
- Tests: `parsePage` (6 tests) in `utils.test.ts`; `getItemsByType`/`getItemsByCollection` pagination in `items.test.ts`; `getAllCollections` pagination in `collections.test.ts`
- Added 30 sample snippets for the demo user (dev DB only, via a one-off script) to exercise multi-page behavior with real data

### 2026-08-17 — Settings Page Completed

- Created `/settings` route: `src/app/settings/layout.tsx` (auth + email verification check + `DashboardShell`, same pattern as `/profile`) and `src/app/settings/page.tsx` (server component, reuses `getProfileUser` for `hasPassword`)
- `proxy.ts` — added `/settings` and `/settings/:path*` to the middleware matcher
- Created `src/components/settings/AccountActionsCard.tsx` — Change Password and Delete Account moved here from `AccountInfoCard`; two-row layout (title + description on the left, action button on the right), rows separated by a divider; `ChangePasswordDialog`/`DeleteAccountDialog` logic unchanged, still calling existing `/api/auth/change-password` and `/api/auth/delete-account`
- `src/components/profile/AccountInfoCard.tsx` trimmed to identity info only (avatar, name, account type, email, member since); no longer a client component, no dialogs
- `Sidebar.tsx` — added "Settings" link (Lucide `Settings` icon) to the user dropdown menu, both expanded and collapsed variants, alongside existing Profile/Sign out
- "Forgot password" in the original ask was clarified with the user to mean the existing Change Password action (not the standalone `/forgot-password` flow, which is untouched)
- No new server actions or utilities — purely a UI relocation reusing existing data functions and API routes; no new unit tests needed per testing scope (utilities/server actions only)

### 2026-08-17 — Editor Preferences Settings Completed

- Added `editorPreferences Json?` (`editor_preferences`) to the `User` model via migration `20260817211015_add_editor_preferences`
- `src/lib/constants/editor-preferences.ts` — `EditorPreferences` type, `DEFAULT_EDITOR_PREFERENCES` (fontSize 12, tabSize 2, wordWrap true, minimap false, theme `vs-dark`), and dropdown option lists
- `src/lib/db/editor-preferences.ts` — `getEditorPreferences`/`updateEditorPreferencesInDb`; `normalizeEditorPreferences` merges stored JSON with defaults field-by-field so null/partial/corrupt data never breaks the editor
- `src/actions/editor-preferences.ts` — `getEditorPreferences`/`updateEditorPreferences` server actions, Zod-validated (font/tab size restricted to option lists, theme restricted to 3-value enum), `{ success, data, error }` pattern
- Created `src/components/dashboard/EditorPreferencesProvider.tsx` — `EditorPreferencesContext`/`useEditorPreferences()`, same shape as `SearchProvider`; fetches on mount, `setPreferences(partial)` updates local state immediately and persists via a 500ms-debounced server action call with a success/error toast
- `DashboardShell.tsx` wraps everything in `EditorPreferencesProvider` (outermost, alongside `SearchProvider`/`ItemDrawerProvider`) so every `CodeEditor` instance across the app — item drawer, new item dialog — shares live preferences
- Created `src/lib/monaco-themes.ts` — `defineCustomMonacoThemes` registers `monokai` and `github-dark` via `monaco.editor.defineTheme` (Monaco only ships `vs-dark`/`vs`/`hc-black` natively)
- `CodeEditor.tsx` — `beforeMount` registers the custom themes; `fontSize`, `tabSize`, `wordWrap`, `minimap`, `theme` now read from `useEditorPreferences()` instead of hardcoded values
- Created `src/components/settings/EditorPreferencesCard.tsx` — 3 `Select` dropdowns + 2 `Switch` toggles wired directly to `setPreferences`, no save button
- Installed shadcn `select` and `switch` components (Base UI–backed)
- `/settings` page — `EditorPreferencesCard` rendered above `AccountActionsCard`
- Dev-server gotcha: the Prisma client singleton in `src/lib/prisma.ts` is intentionally cached on `globalThis` to survive Next.js HMR, so a schema change requires a full `npm run dev` restart (not just a save) to pick up a freshly regenerated client
- Tests: 4 new tests in `src/lib/db/editor-preferences.test.ts` (defaults, stored values, invalid-field fallback); 7 new tests in `src/actions/editor-preferences.test.ts` (unauthorized, validation, success, userId passthrough)

### 2026-08-17 — Favorites Page Completed

- Star icon button added to `TopBar.tsx`, links to `/favorites`
- Created `/favorites` route: `src/app/favorites/layout.tsx` (auth + email verification check + `DashboardShell`, same pattern as `/settings`) and `src/app/favorites/page.tsx` (server component)
- `proxy.ts` — added `/favorites` and `/favorites/:path*` to the middleware matcher
- `DashboardItem` interface and `itemSelect` in `src/lib/db/items.ts` extended with `updatedAt`; `getFavoriteItems(userId)` added — `isFavorite: true`, sorted by `updatedAt desc`
- `getFavoriteCollections(userId)` added to `src/lib/db/collections.ts` — same `isFavorite`/`updatedAt desc` pattern, reuses `withDominantColorInfo`
- Created `src/components/dashboard/FavoritesList.tsx` — compact monospace list (not cards), separate Items/Collections sections with counts; item row click opens `ItemDrawer` via `useItemDrawer`, collection row is a `Link` to `/collections/[id]`; empty state when no favorites
- Page title on `/favorites` includes a yellow filled star icon
- No dedicated `favoritedAt` timestamp exists on `Item`/`Collection`, so `updatedAt` is used as the "recently favorited" sort proxy (documented tradeoff, confirmed acceptable — `updatedAt` also changes on unrelated edits)
- Tests: `getFavoriteItems` in `src/lib/db/items.test.ts`, `getFavoriteCollections` in `src/lib/db/collections.test.ts`

### 2026-08-18 — Favorite Toggle Button Completed

- Created `toggleItemFavoriteById` (`src/lib/db/items.ts`) and `toggleCollectionFavoriteInDb` (`src/lib/db/collections.ts`) — ownership-scoped via `findFirst` + `updateMany` (IDOR-safe), flip the current `isFavorite` value
- Added `toggleItemFavorite`/`toggleCollectionFavorite` server actions (`src/actions/items.ts`, `src/actions/collections.ts`) — `auth()` guard, `{ success, isFavorite, error }` pattern
- `ItemDrawer.tsx` — Favorite button in the action bar wired up (previously styled but non-functional); updates the open item via existing `onItemUpdated` callback, which also triggers `router.refresh()`
- `CollectionDetailActions.tsx` — Favorite button wired up (previously a disabled "coming soon" placeholder)
- `CollectionCard.tsx` — dropdown "Favorite"/"Unfavorite" menu item enabled and wired
- `ItemCard.tsx` — added a hover-visible favorite toggle button top-right of the card (always visible when favorited); removed the old static star badge next to the title to avoid duplication
- `ImageCard.tsx` — favorite badge top-right converted from static display into a clickable toggle button
- All toggles use local `useState` seeded from the server prop plus `router.refresh()` after a successful toggle, matching the existing edit/delete mutation pattern used elsewhere in these components
- Tests: 5 new tests for `toggleItemFavorite` in `src/actions/items.test.ts`, 5 new tests for `toggleCollectionFavorite` in `src/actions/collections.test.ts` (unauthorized, not-found, success, userId/id passthrough) — DB-level toggle functions are mutations and, per the existing convention in this codebase, are only covered indirectly through the action-layer tests, not directly

### 2026-08-18 — Favorites Sorting Completed

- `FavoritesList.tsx` — added a "Sort by" `Select` control (Date/Name/Type) above the Items/Collections sections; sorting is entirely client-side via `useState<SortOption>` + `useMemo`, no new server action or DB query
- `sortItems`/`sortCollections` helper functions: Date sorts by `updatedAt` desc (matches prior default order), Name sorts alphabetically by title/name, Type sorts items by `itemType.name` — Type has no meaning for collections so it falls back to Date order there
- Default sort is "Date" so the page's initial appearance is unchanged from before this feature
- Fixed a pre-existing bug surfaced while testing: Base UI's `<Select.Value>` needs an `items` prop on the `<Select>` root to resolve the selected value into its display label — without it, the closed trigger showed the raw `value` (e.g. lowercase "date") instead of the item's rendered label ("Date"), while the open dropdown looked correct since it renders `SelectItem` children directly. Fixed by passing `items={...}` on all `<Select>` roots in `FavoritesList.tsx` and `EditorPreferencesCard.tsx` (the latter's font size/tab size/theme selects had the same latent bug)

### 2026-08-18 — Pinned Items Completed

- `toggleItemPinById` added to `src/lib/db/items.ts` — mirrors `toggleItemFavoriteById`, ownership-scoped via `findFirst` + `updateMany` (IDOR-safe), flips `isPinned`
- `toggleItemPin` server action added to `src/actions/items.ts` — `auth()` guard, `{ success, isPinned, error }` pattern
- `ItemDrawer.tsx` — Pin button in the action bar wired up with a true optimistic update: flips `isPinned` immediately via `onItemUpdated` before the server call resolves, reverts + error toast on failure, success toast ("Item pinned"/"Item unpinned") on confirmation
- Bug found during manual testing: `onItemUpdated` also triggers `router.refresh()`; calling it only optimistically (before `await toggleItemPin` resolved) meant the refresh could race ahead of the DB write, leaving listings showing the stale unpinned state permanently. Fixed by calling `onItemUpdated` a second time with the server-confirmed `isPinned` value after the toggle succeeds, guaranteeing a refresh that happens after the write lands
- `getItemsByType`/`getItemsByCollection` (`src/lib/db/items.ts`) — `orderBy` changed to `[{ isPinned: "desc" }, { lastUsedAt: ... }]` so pinned items sort to the top of `/items/[type]` and `/collections/[id]` listings
- Dashboard's `getRecentItems` intentionally left unchanged — the dashboard already has a separate "Pinned" section above "Recent", so mixing pin-first ordering there would be redundant
- `ItemCard.tsx` pin icon remains a static, non-clickable indicator per spec — only the drawer's Pin button is interactive
- Tests: 5 new tests for `toggleItemPin` in `src/actions/items.test.ts` (unauthorized, not-found, success, userId/itemId passthrough)

### 2026-08-19 — Homepage Mockup Completed

- Created a standalone static prototype at `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`) per `context/features/homepage-mockup-spec.md` — isolated from the Next.js app, no React/Server Actions/Prisma
- Hero "chaos to order": 13 floating icons (Notion, GitHub, Slack, VS Code, browser tabs, terminal, text file, bookmark, Figma, Docker, Trello, mail) animated via `requestAnimationFrame` — wall bounce, continuous ambient jitter drift (so icons never settle motionless), mouse repulsion with a speed clamp so cursor passes stay gentle; icons sized at 76px per feedback that the original 52px felt small
- Arrow pulse animation rewritten to read rotation from a `--arrow-rotate` custom property inside the keyframes themselves — the mobile 90°-rotation media query was previously being silently overwritten every frame by the `arrowPulse` keyframes' own `transform: scale(...)`, since an animation's `transform` replaces rather than composes with a separately-set static `transform`
- Dashboard preview mockup redesigned to mirror the real app more closely: a `mini-topbar` (logo dot + search bar + outline/solid button placeholders, matching the real TopBar's New Collection/New Item buttons) sits above an expanded sidebar (7 item types with dot + name + count, e.g. "Snippet 24") and a content area (4 stat tiles + a 6-card grid with colored top borders); sidebar narrowed after initially looking oversized relative to the content column
- Item type accent colors switched from the spec's originally invented palette to match the real app's `ITEM_TYPE_COLORS` (`src/lib/constants/icon-map.ts`) — Snippet blue, Prompt purple, Command orange, Note yellow, Link/URL green, File gray, Image pink — per explicit request that the mockup simulate the real app rather than use arbitrary colors; added a dedicated `--color-success` token so checkmarks and the "Save 25%" badge stay green independent of Note's color
- H1 headline iterated through a blue→pink gradient, then a blue→gold gradient, before landing on a flat solid blue accent word with no gradient — gradients read as a generic AI-generated landing page cliché; heading font switched from the system stack to a loaded Inter webfont (600/700/800) with H1 bumped to `font-weight: 800` after an initial Space Grotesk pick read as too thin/sharp
- Features and Pricing sections each wrapped in a full-bleed lighter background band (`--bg-elevated`) for visual separation from the page background; cards inside both sections bumped to `--bg-card` so they still stand out against their band instead of blending in
- Footer redesigned twice: first simplified to a centered single column, then — after feedback that the logo lockup and divider lines looked dated — the logo was dropped entirely (the copyright line already names DevStash) and both `border-top` dividers removed in favor of spacing alone
- Mobile nav dropdown given its own opaque background (`var(--bg)`) — it previously inherited the navbar's translucent scroll-state background, letting hero text bleed through visibly when opened at the top of the page
- Manually verified via a local static file server + Playwright across desktop/mobile viewports, the mobile menu, and the pricing monthly/yearly toggle during development; later rounds of polish were driven directly by iterative user feedback rather than further automated checks (user preference — see memory)

### 2026-08-21 — Homepage Completed

- Replaced the placeholder `src/app/page.tsx` with the real marketing homepage rebuilt from `prototypes/homepage/`, per `context/features/homepage-spec.md`
- New `src/components/marketing/` folder: `MarketingNavbar`, `Hero`, `ChaosAnimation`, `TransformArrow`, `DashboardPreviewMock`, `Features`, `AiSection`, `CodeMockup`, `PricingSection`, `Cta`, `MarketingFooter`, `ScrollFadeIn`, `SmoothScrollLink` — server components by default, `'use client'` only where interactivity is needed
- `page.tsx` calls `auth()` once and passes `isAuthenticated` down; all CTAs (nav, hero, pricing, bottom CTA) point at `/dashboard` for logged-in visitors instead of `/register`/`/sign-in`
- Reused `ITEM_TYPE_COLORS`/`ICON_MAP` from `src/lib/constants/icon-map.ts` throughout; added `src/lib/constants/marketing.ts` (`MARKETING_ACCENT_COLORS`) only for the two accents with no matching item type (search cyan, success green)
- Kept the app's existing Geist Sans instead of loading Inter for headings, to avoid mixing typefaces
- Found and fixed a real pre-existing bug while wiring up fonts: `globals.css`'s `@theme inline` block had `--font-sans: var(--font-sans)` (self-referencing, invalid), so Geist Sans was never actually applied anywhere in the app — fixed to `var(--font-geist-sans)`, affects the whole app, not just this page
- `ChaosAnimation.tsx` ports the drift/bounce/repel particle physics from the prototype's `script.js` into a React `useEffect` + `requestAnimationFrame` loop; icon size is responsive (48px mobile / 76px desktop via Tailwind breakpoints) and the physics measure the actual rendered icon size from the DOM instead of a hardcoded constant, so mobile icons no longer overlap/crowd
- `src/lib/scroll.ts` (`smoothScrollToId`) — custom eased rAF scroll (cubic easing, 700ms) used by `SmoothScrollLink`, wired into the navbar's Features/Pricing links (desktop + mobile) and the hero's "See Features" button, instead of relying on inconsistent browser-default smooth scrolling
- Navbar iterated several times based on visual feedback: settled on a single floating translucent+blurred state (`bg-background/70 backdrop-blur-md`, no scroll-based opacity toggle — that toggle was invisible against the pure-black page background anyway); mobile menu changed from a full-width slide-down panel to a compact anchored dropdown (`w-56`, rounded, shadow) near the hamburger button
- Nav only shows a single "Sign In" button (white/default variant) instead of Sign In + Get Started, on both desktop and the mobile dropdown — "Get Started" was redundant with the CTAs already present throughout the page
- Features/Pricing sections initially built as `min-h-screen` with vertically-centered content (matching Hero), then reverted to natural content height with generous padding (`py-24 sm:py-32`) after this caused a large empty/"black gap" area above the heading when jumping to the section via nav links — the full-height treatment only actually fits Hero, which is a landing splash, not a content-heavy section
- Found and fixed a real flex/cross-axis bug causing the hero's chaos/dashboard-mock visual to look squished on mobile: the row's `items-center` collapses flex children to their content width once the row switches to `flex-col` (`items-center` sets cross-axis alignment, not size) — fixed with `items-stretch sm:items-center` so both boxes stretch to full width on mobile, with `self-center` added to `TransformArrow` specifically so it still centers instead of stretching
- `PricingSection.tsx`: toggle switch enlarged and kept on a single row on mobile (`flex-nowrap`, `whitespace-nowrap`, responsive sizing) instead of wrapping; Free/Pro cards changed to always-2-column (`grid-cols-2`, no longer stacking on mobile) with compact responsive padding/text/hidden descriptions and shorter button labels on mobile; yearly price shows a struck-through monthly-equivalent (`$8 × 12 = $96`) next to the discounted price; Pro yearly price adjusted to `$69` (user override, no longer matches `project-overview.md`'s `$72/year` — flagged, not yet reconciled)
- `src/app/(auth)/layout.tsx` — added a DevStash logo linking to `/` above the auth card, so sign-in/register/forgot-password/etc. all gained a way back to the homepage from one shared layout change
- `src/components/dashboard/TopBar.tsx` — logo link changed from `/dashboard` to `/`, so clicking it from inside the app now goes to the marketing homepage instead of back to the dashboard
- No automated browser testing — all visual iteration was driven by the user's own manual testing and screenshots (user preference — see memory)
