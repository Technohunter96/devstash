import { Layers, Code } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ICON_MAP, ITEM_TYPE_COLORS } from "@/lib/icon-map";
import type { ProfileStats as ProfileStatsType } from "@/lib/db/profile";

interface Props {
  stats: ProfileStatsType;
}

export default function ProfileStats({ stats }: Props) {
  return (
    <Card className="p-6 space-y-5">
      <h2 className="font-semibold">Usage Statistics</h2>

      {/* Total items + collections */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="size-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: ITEM_TYPE_COLORS.Snippet + "20" }}>
            <Code className="size-5" style={{ color: ITEM_TYPE_COLORS.Snippet }} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{stats.totalItems}</p>
            <p className="text-muted-foreground text-sm mt-0.5">Total Items</p>
          </div>
        </div>
        <div className="border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="size-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: ITEM_TYPE_COLORS.Prompt + "20" }}>
            <Layers className="size-5" style={{ color: ITEM_TYPE_COLORS.Prompt }} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{stats.totalCollections}</p>
            <p className="text-muted-foreground text-sm mt-0.5">Collections</p>
          </div>
        </div>
      </div>

      {/* Items by type */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Items by Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.itemTypeCounts.map((type) => {
            const Icon = ICON_MAP[type.icon];
            return (
              <div
                key={type.name}
                className="border border-border rounded-md px-3 py-2.5 flex items-center gap-2.5"
              >
                {Icon && <Icon className="size-4 shrink-0" style={{ color: type.color }} />}
                <span className="text-sm flex-1 truncate">{type.name}</span>
                <span className="text-sm font-medium tabular-nums">{type.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}