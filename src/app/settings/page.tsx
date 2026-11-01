export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileUser } from "@/lib/db/profile";
import { countUserItems } from "@/lib/db/items";
import { countUserCollections } from "@/lib/db/collections";
import AccountActionsCard from "@/components/settings/AccountActionsCard";
import BillingCard from "@/components/settings/BillingCard";
import EditorPreferencesCard from "@/components/settings/EditorPreferencesCard";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [profileUser, itemCount, collectionCount] = await Promise.all([
    getProfileUser(userId),
    countUserItems(userId),
    countUserCollections(userId),
  ]);

  if (!profileUser) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <EditorPreferencesCard />
      <BillingCard
        isPro={session!.user!.isPro}
        itemCount={itemCount}
        collectionCount={collectionCount}
      />
      <AccountActionsCard hasPassword={profileUser.hasPassword} />
    </div>
  );
}