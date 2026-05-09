# Item Types

Reference for all 7 system item types in DevStash.

---

## Individual Types

### Snippet

| Property | Value |
|----------|-------|
| Icon | `Code` (Lucide) |
| Color | `#3b82f6` (blue) |
| Content mode | `TEXT` |
| Tier | Free |

Purpose: Reusable code blocks in any language. Intended for copy-paste use during development.

Key fields: `content` (the code text), `language` (syntax highlighting hint, e.g. `typescript`, `bash`, `yaml`).

---

### Prompt

| Property | Value |
|----------|-------|
| Icon | `Sparkles` (Lucide) |
| Color | `#8b5cf6` (purple) |
| Content mode | `TEXT` |
| Tier | Free |

Purpose: AI prompt templates for use with LLMs (code review, documentation, refactoring, etc.).

Key fields: `content` (the prompt text). `language` is typically not set.

---

### Command

| Property | Value |
|----------|-------|
| Icon | `Terminal` (Lucide) |
| Color | `#f97316` (orange) |
| Content mode | `TEXT` |
| Tier | Free |

Purpose: Shell commands, CLI one-liners, and multi-step scripts for everyday development tasks.

Key fields: `content` (the command text), `language` (usually `bash`).

---

### Note

| Property | Value |
|----------|-------|
| Icon | `StickyNote` (Lucide) |
| Color | `#fde047` (yellow) |
| Content mode | `TEXT` |
| Tier | Free |

Purpose: Free-form text notes, documentation fragments, and markdown-formatted write-ups.

Key fields: `content` (markdown text). No `language` expected.

---

### Link

| Property | Value |
|----------|-------|
| Icon | `Link2` (rendered as `Link` in ICON_MAP) (Lucide) |
| Color | `#10b981` (green) |
| Content mode | `URL` |
| Tier | Free |

Purpose: Saved URLs — documentation pages, tools, references, and external resources.

Key fields: `url` (the full URL). `content` is not used; `language` is not used.

---

### File

| Property | Value |
|----------|-------|
| Icon | `File` (Lucide) |
| Color | `#6b7280` (gray) |
| Content mode | `FILE` |
| Tier | Pro |

Purpose: Uploaded binary or text files stored in Cloudflare R2.

Key fields: `fileUrl` (R2 object URL), `fileName` (original filename), `fileSize` (bytes). `content` and `url` are not used.

---

### Image

| Property | Value |
|----------|-------|
| Icon | `Image` (Lucide) |
| Color | `#ec4899` (pink) |
| Content mode | `FILE` |
| Tier | Pro |

Purpose: Uploaded image files (screenshots, diagrams, assets) stored in Cloudflare R2.

Key fields: `fileUrl`, `fileName`, `fileSize` — same as File. Rendered with image preview rather than a generic file icon.

---

## Summaries

### Content Mode Classification

| Mode | Types | Primary field |
|------|-------|---------------|
| `TEXT` | Snippet, Prompt, Command, Note | `content` |
| `URL` | Link | `url` |
| `FILE` | File, Image | `fileUrl`, `fileName`, `fileSize` |

### Shared Properties (all types)

All items share: `id`, `title`, `description`, `isFavorite`, `isPinned`, `lastUsedAt`, `tags`, `collections`, `userId`, `itemTypeId`, `createdAt`, `updatedAt`.

### Display Differences

| Aspect | TEXT types | URL type | FILE types |
|--------|-----------|----------|-----------|
| Body rendered as | Markdown / syntax-highlighted code | Clickable URL | File download / image preview |
| `language` field | Used by Snippet, Command | — | — |
| Copy action | Copies `content` | Copies `url` | Downloads file |
| Tier gate | Free | Free | Pro |

### System vs Custom Types

All 7 types above are **system types** (`isSystem: true`, `userId: null`). They are seeded once, are immutable, and shared across all users. Custom types (Pro feature, post-launch) will have `isSystem: false` and a non-null `userId`.

### Display Order

Canonical order used in UI (from `ITEM_TYPE_ORDER` in `src/lib/db/items.ts`):

1. Snippet
2. Prompt
3. Command
4. Note
5. Link
6. File
7. Image

File and Image are last because they are Pro-only. The seed file defines them in a different order — `ITEM_TYPE_ORDER` is the authoritative source for UI ordering.
