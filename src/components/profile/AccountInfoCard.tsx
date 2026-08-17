import { Mail, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import type { ProfileUser } from "@/lib/db/profile";

interface Props {
  user: ProfileUser;
}

export default function AccountInfoCard({ user }: Props) {
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(user.createdAt);

  const accountType = user.hasPassword ? "Email account" : "GitHub account";

  return (
    <Card className="p-6 space-y-5">
      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <UserAvatar name={user.name} image={user.image} size={56} />
        <div>
          <p className="font-semibold text-base">{user.name ?? "No name"}</p>
          <p className="text-muted-foreground text-sm">{accountType}</p>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Mail className="size-4 shrink-0" />
          <span>Email:</span>
          <span className="text-foreground">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          <span>Member since:</span>
          <span className="text-foreground">{memberSince}</span>
        </div>
      </div>
    </Card>
  );
}