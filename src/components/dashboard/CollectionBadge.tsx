import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CollectionBadgeProps {
  name: string;
  color: string | null;
}

export default function CollectionBadge({ name, color }: CollectionBadgeProps) {
  return (
    <Badge variant="secondary">
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", !color && "bg-muted-foreground/50")}
        style={color ? { backgroundColor: color } : undefined}
      />
      {name}
    </Badge>
  );
}