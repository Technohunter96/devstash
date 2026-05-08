export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileUser, getProfileStats } from "@/lib/db/profile";
import AccountInfoCard from "@/components/profile/AccountInfoCard";
import ProfileStats from "@/components/profile/ProfileStats";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profileUser, stats] = await Promise.all([
    getProfileUser(session.user.id),
    getProfileStats(session.user.id),
  ]);

  if (!profileUser) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <AccountInfoCard user={profileUser} />
      <ProfileStats stats={stats} />
    </div>
  );
}