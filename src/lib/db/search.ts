import { prisma } from "@/lib/prisma";
import { getDominantColors } from "@/lib/db/collections";

export interface SearchItem {
  id: string;
  title: string;
  description: string | null;
  typeName: string;
  typeIcon: string;
  typeColor: string;
  // First 120 chars of content for preview
  contentPreview: string | null;
}

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
  dominantColor: string | null;
}

// Fetch all user items with minimal fields for client-side fuzzy search
export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      itemType: {
        select: { name: true, icon: true, color: true },
      },
    },
    orderBy: { title: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    typeName: item.itemType.name,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    contentPreview: item.content ? item.content.slice(0, 120) : null,
  }));
}

// Fetch all user collections with item counts for client-side fuzzy search
export async function getSearchCollections(
  userId: string
): Promise<SearchCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
    },
    orderBy: { name: "asc" },
  });

  const collectionIds = collections.map((c) => c.id);
  const dominantColors = await getDominantColors(collectionIds);

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemCount: collection._count.items,
    dominantColor: dominantColors.get(collection.id) ?? null,
  }));
}
