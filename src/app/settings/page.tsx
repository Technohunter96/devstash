export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileUser } from "@/lib/db/profile";
import AccountActionsCard from "@/components/settings/AccountActionsCard";
import EditorPreferencesCard from "@/components/settings/EditorPreferencesCard";

export default async function SettingsPage() {
  const session = await auth();

  const profileUser = await getProfileUser(session!.user!.id);

  if (!profileUser) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <EditorPreferencesCard />
      <AccountActionsCard hasPassword={profileUser.hasPassword} />
    </div>
  );
}