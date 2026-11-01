export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { countUserItems } from "@/lib/db/items";
import { countUserCollections } from "@/lib/db/collections";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/constants/billing";
import UpgradePlans from "@/components/billing/UpgradePlans";

export default async function UpgradePage() {
  const session = await auth();
  const userId = session!.user!.id;

  // Pro users have nothing to buy — they manage their plan in Settings
  if (session!.user!.isPro) {
    redirect("/settings");
  }

  const [itemCount, collectionCount] = await Promise.all([
    countUserItems(userId),
    countUserCollections(userId),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold">
          <Sparkles className="size-6 text-blue-500" />
          Upgrade to Pro
        </h1>
        <p className="text-muted-foreground">
          Unlock unlimited items, file uploads, AI features, and more.
        </p>
        <p className="text-sm text-muted-foreground">
          You&apos;re currently using {itemCount}/{FREE_ITEM_LIMIT} items and {collectionCount}/
          {FREE_COLLECTION_LIMIT} collections.
        </p>
      </div>
      <UpgradePlans />
    </div>
  );
}