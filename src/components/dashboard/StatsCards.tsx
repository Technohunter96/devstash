import { Layers, Star, Bookmark, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

const stats = (props: StatsCardsProps) => [
  {
    label: "Total Items",
    value: props.totalItems,
    icon: Layers,
    color: "#3b82f6",
  },
  {
    label: "Collections",
    value: props.totalCollections,
    icon: FolderOpen,
    color: "#8b5cf6",
  },
  {
    label: "Favourite Items",
    value: props.favoriteItems,
    icon: Star,
    color: "#f97316",
  },
  {
    label: "Favourite Collections",
    value: props.favoriteCollections,
    icon: Bookmark,
    color: "#ec4899",
  },
];

export default function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats(props).map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 px-4 py-3">
            <div
              className="rounded-lg p-2.5 shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
