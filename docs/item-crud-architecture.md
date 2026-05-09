# Item CRUD Architecture

Design for a unified create/read/update/delete system covering all 7 item types.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                   # All mutations (create, update, delete, toggle)
├── lib/
│   └── db/
│       └── items.ts               # All queries (extend existing file)
├── app/
│   └── items/
│       └── [type]/
│           ├── page.tsx           # Server component — renders item list
│           └── loading.tsx        # Skeleton while fetching
└── components/
    └── items/
        ├── ItemList.tsx           # Server — receives items, maps to ItemCard
        ├── ItemCard.tsx           # Client — displays item, copy/open handlers
        ├── ItemDrawer.tsx         # Client — view/create/edit drawer
        ├── ItemForm.tsx           # Client — unified form, adapts by contentType
        └── ItemContent.tsx        # Client — renders content by contentType
```

---

## `/items/[type]` Routing

URL segments use **plural lowercase** names matching the project spec:
`/items/snippets`, `/items/prompts`, `/items/commands`, `/items/notes`, `/items/links`, `/items/files`, `/items/images`

The `[type]` param is a slug that maps to the DB `ItemType.name`:

```ts
// src/lib/item-type-slug.ts
export const SLUG_TO_TYPE: Record<string, string> = {
  snippets: "Snippet",
  prompts:  "Prompt",
  commands: "Command",
  notes:    "Note",
  links:    "Link",
  files:    "File",
  images:   "Image",
};

export const TYPE_TO_SLUG: Record<string, string> = {
  Snippet: "snippets",
  Prompt:  "prompts",
  Command: "commands",
  Note:    "notes",
  Link:    "links",
  File:    "files",
  Image:   "images",
};
```

`page.tsx` resolves the slug to a type name, calls `notFound()` for unknown slugs, and passes the resolved type down to child components:

```ts
// src/app/items/[type]/page.tsx (server component)
export default async function ItemTypePage({ params }: { params: { type: string } }) {
  const typeName = SLUG_TO_TYPE[params.type];
  if (!typeName) notFound();

  const session = await auth();
  const items = await getItemsByType(session.user.id, typeName);
  const itemType = await getItemType(typeName);

  return <ItemList items={items} itemType={itemType} />;
}
```

---

## Data Fetching — `src/lib/db/items.ts`

Add these queries to the existing file:

| Function | Purpose |
|---|---|
| `getItemsByType(userId, typeName, opts?)` | Paginated list for `/items/[type]` page |
| `getItemById(userId, itemId)` | Full item for drawer view/edit |
| `getItemType(typeName)` | Resolve type metadata (icon, color, contentType) |

`getItemsByType` returns items with `itemType`, `tags`, and `collections` included so the list page has everything it needs in a single query.

---

## Mutations — `src/actions/items.ts`

One file, five actions, all session-guarded:

```ts
export async function createItem(data: CreateItemInput): Promise<ActionResult<Item>>
export async function updateItem(id: string, data: UpdateItemInput): Promise<ActionResult<Item>>
export async function deleteItem(id: string): Promise<ActionResult<void>>
export async function toggleFavorite(id: string): Promise<ActionResult<void>>
export async function togglePinned(id: string): Promise<ActionResult<void>>
```

All return `{ success: boolean; data?: T; error?: string }`.

Input types use Zod schemas. The same `CreateItemInput` / `UpdateItemInput` cover all 7 types — only the relevant fields are populated depending on `contentType`:

| `contentType` | Required fields | Ignored fields |
|---|---|---|
| `TEXT` | `content` | `url`, `fileUrl`, `fileName`, `fileSize` |
| `URL` | `url` | `content`, `fileUrl`, `fileName`, `fileSize` |
| `FILE` | `fileUrl`, `fileName`, `fileSize` | `content`, `url` |

Actions always verify `item.userId === session.user.id` before mutating — never trust the client.

---

## Where Type-Specific Logic Lives

Type-specific behavior lives in **components**, not in actions or DB functions. Actions and queries are content-type-agnostic.

### `ItemForm.tsx`

Unified form used for both create and edit. Receives `contentType` (derived from the selected `itemTypeId`) and renders different body fields:

```
contentType === "TEXT" → MarkdownEditor (or CodeEditor when language is set)
contentType === "URL"  → URL input with validation
contentType === "FILE" → FileUpload dropzone (R2 upload, then stores fileUrl)
```

Shared fields rendered for all types: `title`, `description`, `tags`, `collections`.

The `language` field is only shown for `Snippet` and `Command` (checked by type name).

### `ItemContent.tsx`

Renders the read-only body of an item inside the drawer:

```
contentType === "TEXT" → Markdown renderer / syntax-highlighted code block
contentType === "URL"  → Clickable link with external icon
contentType === "FILE" → Image preview (Image type) or file download link (File type)
```

The distinction between `File` and `Image` (both `FILE` contentType) is made by checking `itemType.name`.

### `ItemCard.tsx`

The copy action is content-type-aware:

```
TEXT → copies content to clipboard
URL  → copies url to clipboard
FILE → triggers file download
```

---

## Component Responsibilities

| Component | Type | Responsibility |
|---|---|---|
| `page.tsx` | Server | Auth, slug resolution, data fetch, passes props down |
| `ItemList.tsx` | Server | Receives items array, maps to `ItemCard`, handles empty state |
| `ItemCard.tsx` | Client | Hover state, copy action, opens drawer on click |
| `ItemDrawer.tsx` | Client | Sheet/drawer shell; switches between view and edit modes; calls server actions |
| `ItemForm.tsx` | Client | Controlled form; adapts fields by `contentType`; calls `createItem` / `updateItem` |
| `ItemContent.tsx` | Client | Pure display; no state; receives full item, renders by `contentType` |

The drawer (`ItemDrawer`) holds the edit/view toggle state. It does not fetch data — it receives the full item from `ItemCard` via a context or prop drilling, depending on implementation.

---

## Drawer State — Where It Lives

`ItemDrawerContext` is provided by `DashboardShell`, not by the items page. The `<ItemDrawer>` sheet is rendered as a sibling to `<main>` inside the shell — not inside the page.

```
DashboardShell  (provides ItemDrawerContext)
├── TopBar          → useItemDrawer().open(null)    // create mode
├── Sidebar
├── main
│   └── /items/[type] page
│       └── ItemCard  → useItemDrawer().open(item)  // view/edit mode
└── ItemDrawer ← rendered here, not in the page
```

This mirrors how DashboardShell already manages sidebar state (`sidebarOpen`, `sidebarCollapsed`) — drawer state is just two more values of the same kind.

```ts
// src/components/items/ItemDrawerContext.tsx
interface ItemDrawerContext {
  open: (item: Item | null) => void; // null = create mode
  close: () => void;
}

export function useItemDrawer() {
  return useContext(ItemDrawerContext);
}
```

Both `TopBar` and every `ItemCard` call `useItemDrawer()` — no prop drilling, consistent API across the whole layout.

---

## Data Flow Summary

```
/items/snippets
  └── page.tsx (server)
        ├── resolves slug → "Snippet"
        ├── getItemsByType(userId, "Snippet")
        └── <ItemDrawerProvider>
              └── <ItemList items={...} itemType={...}>
                    └── <ItemCard> × N
                          └── onClick → drawer.open(item)
                                └── <ItemDrawer>
                                      ├── view mode → <ItemContent item={item} />
                                      └── edit mode → <ItemForm item={item} onSave={updateItem} />

New Item button
  └── drawer.open(null)  ← create mode
        └── <ItemDrawer>
              └── <ItemForm itemType={itemType} onSave={createItem} />
```

---

## Notes

- `getItemsByType` should support cursor-based pagination (`cursor`, `take`) for large collections — add when implementing, not after.
- File upload (R2) happens client-side before the form is submitted; `createItem` / `updateItem` only receive the resulting `fileUrl`, not the raw file.
- Tags use `upsert` on the `Tag` model inside `createItem` / `updateItem` — find-or-create per `(name, userId)` unique constraint.
- Collections are connected via `ItemCollection` join table — pass an array of `collectionId` strings in the action and sync with `set`.
