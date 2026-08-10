"use server";

import { auth } from "@/auth";
import { getSearchItems, getSearchCollections } from "@/lib/db/search";
import type { SearchItem, SearchCollection } from "@/lib/db/search";

export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}

// Fetch all searchable data for the current user (called once on palette open)
export async function getSearchData(): Promise<SearchData> {
  const session = await auth();
  if (!session?.user?.id) {
    return { items: [], collections: [] };
  }

  const [items, collections] = await Promise.all([
    getSearchItems(session.user.id),
    getSearchCollections(session.user.id),
  ]);

  return { items, collections };
}
