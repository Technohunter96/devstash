# DevStash — Project Overview

One fast, searchable, AI-enhanced hub for all developer knowledge & resources.

---

## Problem

Developers keep essentials scattered — snippets in VS Code, prompts in AI chats, commands in bash history, links in bookmarks, docs in random folders. DevStash is a single organized home for everything a developer reaches for daily.

---

## Users

- **Everyday Developer** — fast access to snippets, commands, links
- **AI-first Developer** — organized prompt library, system messages, workflows
- **Content Creator / Educator** — code blocks, explanations, course notes
- **Full-stack Builder** — patterns, boilerplates, API examples

---

## Features

### A. Items & Item Types

Items are the core unit with a **type** that determines behavior and appearance. System types are immutable; custom types are Pro.

Content mode is one of: `text` (snippet, note, prompt, command), `url` (link), or `file` (file, image).

**System Types:**

| Type    | Icon         | Color     | Content Mode | Tier |
| ------- | ------------ | --------- | ------------ | ---- |
| Snippet | `Code`       | `#3b82f6` | text         | Free |
| Prompt  | `Sparkles`   | `#8b5cf6` | text         | Free |
| Command | `Terminal`   | `#f97316` | text         | Free |
| Note    | `StickyNote` | `#fde047` | text         | Free |
| Link    | `Link`       | `#10b981` | url          | Free |
| File    | `File`       | `#6b7280` | file         | Pro  |
| Image   | `Image`      | `#ec4899` | file         | Pro  |

Icons from [Lucide Icons](https://lucide.dev/icons/). URL structure: `/items/snippets`, `/items/prompts`, etc.

Items open in a **quick-access drawer**.

### B. Collections

Named groups of items. An item can belong to **multiple collections** (many-to-many).

### C. Search

Full search across content, titles, tags, and types.

### D. Authentication

Email/password and GitHub OAuth via NextAuth v5.

### E. Core Features

- Collection & item favorites
- Pin items to top
- Recently used tracking
- Import code from file
- Markdown editor (text types)
- File upload (file/image types)
- Export data (JSON/ZIP — Pro)
- Dark mode default, light mode optional
- Multi-collection assignment
- View which collections an item belongs to

### F. AI Features (Pro Only)

- Auto-tag suggestions
- Summaries (TL;DR for notes/snippets)
- Explain This Code
- Prompt optimizer

---

## Data Model (Prisma — Rough Draft)

> Field names and relations will evolve. This is a starting point.

```prisma
model User {
  id                   String    @id @default(cuid())
  name                 String?
  email                String    @unique
  emailVerified        DateTime?
  image                String?
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique

  items       Item[]
  itemTypes   ItemType[]
  collections Collection[]
  tags        Tag[]
  accounts    Account[]
  sessions    Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Item {
  id          String  @id @default(cuid())
  title       String
  description String?

  contentType ContentType @default(TEXT)
  content     String?     // text content
  url         String?     // for link types
  fileUrl     String?     // Cloudflare R2 URL
  fileName    String?
  fileSize    Int?

  language   String?
  isFavorite Boolean  @default(false)
  isPinned   Boolean  @default(false)
  lastUsedAt DateTime?

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  tags        Tag[]
  collections ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

enum ContentType {
  TEXT
  URL
  FILE
}

model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String
  color    String
  isSystem Boolean @default(false)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  @@unique([name, userId])
}

model Collection {
  id          String  @id @default(cuid())
  name        String
  description String?
  isFavorite  Boolean @default(false)

  defaultTypeId String?
  defaultType   ItemType? @relation(fields: [defaultTypeId], references: [id])

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model ItemCollection {
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  addedAt DateTime @default(now())

  @@id([itemId, collectionId])
}

model Tag {
  id   String @id @default(cuid())
  name String

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  @@unique([name, userId])
}
```

---

## Tech Stack

| Layer            | Technology                  | Notes                                  |
| ---------------- | --------------------------- | -------------------------------------- |
| **Framework**    | Next.js 16 / React 19       | SSR + API routes, single repo          |
| **Language**     | TypeScript                  |                                        |
| **Database**     | Neon (PostgreSQL)           | Serverless Postgres                    |
| **ORM**          | Prisma 7                    | Migrations only — **never `db push`**  |
| **Auth**         | NextAuth v5                 | Email/password + GitHub OAuth          |
| **File Storage** | Cloudflare R2               | S3-compatible                          |
| **AI**           | OpenAI `gpt-5-nano`         | Auto-tag, summarize, explain, optimize |
| **Styling**      | Tailwind CSS v4 + shadcn/ui |                                        |
| **Caching**      | Redis (TBD)                 | Evaluate during development            |
| **Payments**     | Stripe                      | Subscription billing                   |

---

## Monetization

### Free

- 50 items, 3 collections
- All system types except File & Image
- Basic search, no file uploads, no AI

### Pro — $8/month or $72/year

- Unlimited items & collections
- File & image uploads
- AI features
- Custom types (post-launch)
- Export (JSON/ZIP)
- Priority support

> During development all users have full access. Limits enforced before launch.

---

## UI/UX

**Style:** Modern, minimal, developer-focused. Dark mode default. Reference: Notion × Linear × Raycast. Syntax highlighting for code.

**Layout:**

- **Sidebar** (collapsible) — item type links, recent collections
- **Main** — grid of collection cards (color-coded by dominant type); item cards use type color as border
- **Drawer** — quick-access for viewing/creating/editing items
- **Mobile** — sidebar collapses to drawer

**Micro-interactions:** Smooth transitions, hover states, toast notifications, loading skeletons.

### Screenshots

Refer to screenshots below as a base for the dashboard UI.
It does not have to be exact. Use it as a reference:

@context\screenshots\dashboard-ui-dashboard.jpg
@context\screenshots\dashboard-ui-drawer-1.jpg
@context\screenshots\dashboard-ui-drawer-2.jpg
