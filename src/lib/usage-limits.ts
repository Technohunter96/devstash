// Pure gating logic — no prisma/auth() imports. Phase 2 server actions pass in a count
// they've already fetched plus session.user.isPro; this module just decides yes/no.
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from "@/lib/constants/billing";

export type LimitCheck = { allowed: true } | { allowed: false; reason: string };

export function canCreateItem(currentItemCount: number, isPro: boolean): LimitCheck {
  if (isPro || currentItemCount < FREE_ITEM_LIMIT) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
  };
}

export function canCreateCollection(currentCollectionCount: number, isPro: boolean): LimitCheck {
  if (isPro || currentCollectionCount < FREE_COLLECTION_LIMIT) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
  };
}

export function canUploadFileType(typeName: string, isPro: boolean): LimitCheck {
  if (isPro || (typeName !== "File" && typeName !== "Image")) return { allowed: true };
  return {
    allowed: false,
    reason: "File and image uploads are a Pro feature. Upgrade to Pro to enable them.",
  };
}