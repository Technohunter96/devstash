import { prisma } from "@/lib/prisma";
import { PRO_ITEM_TYPE_NAMES } from "@/lib/constants";

export interface SidebarItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  itemCount: number;
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
}

export async function getSidebarItemTypes(
  userId: string
): Promise<SidebarItemType[]> {
  const itemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      items: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return itemTypes
    .map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      isSystem: t.isSystem,
      itemCount: t.items.length,
    }))
    .sort(
      (a, b) =>
        Number(PRO_ITEM_TYPE_NAMES.includes(a.name)) -
        Number(PRO_ITEM_TYPE_NAMES.includes(b.name))
    );
}

export async function getSidebarCollections(
  userId: string,
  limit = 8
): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: { select: { name: true, color: true } },
            },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const itemCount = col.items.length;

    // Find dominant color from most-used item type
    const typeCountMap = new Map<string, { count: number; color: string }>();
    for (const ic of col.items) {
      const { name, color } = ic.item.itemType;
      const existing = typeCountMap.get(name);
      if (existing) {
        existing.count++;
      } else {
        typeCountMap.set(name, { count: 1, color });
      }
    }
    const sorted = [...typeCountMap.values()].sort((a, b) => b.count - a.count);
    const dominantColor = sorted.length > 0 ? sorted[0].color : null;

    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      itemCount,
      dominantColor,
    };
  });
}
