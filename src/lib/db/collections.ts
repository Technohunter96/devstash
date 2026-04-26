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
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: {
                select: { name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const itemCount = col.items.length;

    // Count occurrences per item type to find dominant type
    const typeCountMap = new Map<
      string,
      { count: number; type: CollectionItemType }
    >();
    for (const ic of col.items) {
      const { name, icon, color } = ic.item.itemType;
      const existing = typeCountMap.get(name);
      if (existing) {
        existing.count++;
      } else {
        typeCountMap.set(name, { count: 1, type: { name, icon, color } });
      }
    }

    // Sort by count desc — dominant type first, rest follow
    const sortedTypes = [...typeCountMap.values()].sort(
      (a, b) => b.count - a.count
    );
    const itemTypes = sortedTypes.map(({ type }) => type);
    const dominantColor = sortedTypes.length > 0 ? sortedTypes[0].type.color : null;

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount,
      itemTypes,
      dominantColor,
      updatedAt: col.updatedAt,
    };
  });
}
