import { prisma } from "@/lib/prisma";

interface CollectionItemType {
  name: string;
  icon: string;
  color: string;
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  itemTypes: CollectionItemType[];
  dominantColor: string | null;
  updatedAt: Date;
}

export interface CollectionStats {
  totalCollections: number;
  favoriteCollections: number;
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { totalCollections, favoriteCollections };
}

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  const collectionIds = collections.map((c) => c.id);

  const itemTypeLinks = await prisma.itemCollection.findMany({
    where: { collectionId: { in: collectionIds } },
    select: {
      collectionId: true,
      item: {
        select: {
          itemType: { select: { name: true, icon: true, color: true } },
        },
      },
    },
  });

  // Build per-collection type count maps
  const typesByCollection = new Map<
    string,
    Map<string, { count: number; type: CollectionItemType }>
  >();
  for (const link of itemTypeLinks) {
    let typeCountMap = typesByCollection.get(link.collectionId);
    if (!typeCountMap) {
      typeCountMap = new Map();
      typesByCollection.set(link.collectionId, typeCountMap);
    }
    const { name, icon, color } = link.item.itemType;
    const existing = typeCountMap.get(name);
    if (existing) {
      existing.count++;
    } else {
      typeCountMap.set(name, { count: 1, type: { name, icon, color } });
    }
  }

  return collections.map((col) => {
    const typeCountMap = typesByCollection.get(col.id);
    // Sort by count desc — dominant type first
    const sortedTypes = typeCountMap
      ? [...typeCountMap.values()].sort((a, b) => b.count - a.count)
      : [];
    const itemTypes = sortedTypes.map(({ type }) => type);
    const dominantColor = sortedTypes.length > 0 ? sortedTypes[0].type.color : null;

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      itemTypes,
      dominantColor,
      updatedAt: col.updatedAt,
    };
  });
}
