import { ITEM_TYPE_COLORS } from "@/lib/constants/icon-map";

const NAV_ROWS: { type: keyof typeof ITEM_TYPE_COLORS; count: number }[] = [
  { type: "Snippet", count: 24 },
  { type: "Prompt", count: 18 },
  { type: "Command", count: 12 },
  { type: "Note", count: 31 },
  { type: "Link", count: 45 },
  { type: "File", count: 8 },
  { type: "Image", count: 5 },
];

const STAT_TYPES: (keyof typeof ITEM_TYPE_COLORS)[] = ["Snippet", "Note", "Image", "Link"];
const CARD_TYPES: (keyof typeof ITEM_TYPE_COLORS)[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "Image",
  "Link",
];

// Static mockup of the real dashboard — mirrors TopBar/Sidebar/StatsCards/Collections at a glance, no real data
export function DashboardPreviewMock() {
  return (
    <div className="flex h-[340px] flex-col overflow-hidden rounded-xl border border-border bg-card max-sm:h-[280px]">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-2.5 py-2.5">
        <span className="size-2.5 shrink-0 rounded-[3px] bg-blue-500" />
        <span className="h-3.5 flex-1 rounded-md border border-border bg-card" />
        <span className="h-4 w-8 shrink-0 rounded-md border border-border" />
        <span className="h-4 w-8 shrink-0 rounded-md bg-foreground" />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[92px] shrink-0 flex-col gap-1.5 border-r border-border bg-muted/40 p-2">
          {NAV_ROWS.map((row) => (
            <div key={row.type} className="flex items-center gap-1.5">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: ITEM_TYPE_COLORS[row.type] }}
              />
              <span className="flex-1 truncate text-[0.56rem] text-muted-foreground">{row.type}</span>
              <span className="text-[0.54rem] text-muted-foreground/60">{row.count}</span>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-4">
          <div className="flex gap-2">
            {STAT_TYPES.map((type) => (
              <div key={type} className="flex flex-1 flex-col gap-1.5 rounded-md border border-border bg-muted/40 p-1.5">
                <span className="size-3.5 rounded-[4px]" style={{ background: ITEM_TYPE_COLORS[type] }} />
                <span className="block h-1.5 w-[65%] rounded-full bg-border" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CARD_TYPES.map((type) => (
              <div
                key={type}
                className="flex flex-col gap-1.5 rounded-md border border-border border-t-[3px] bg-muted/40 p-2"
                style={{ borderTopColor: ITEM_TYPE_COLORS[type] }}
              >
                <span className="block h-1.5 w-[70%] rounded-full bg-border" />
                <span className="block h-1.5 w-[45%] rounded-full bg-border opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
