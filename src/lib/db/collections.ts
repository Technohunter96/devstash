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

export interface CreateCollectionData {
  name: string;
  description: string | null;
}

export async function createCollectionInDb(
  userId: string,
  data: CreateCollectionData
): Promise<DashboardCollection> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    itemTypes: [],
    dominantColor: null,
    updatedAt: collection.updatedAt,
  };
}

export interface CollectionOption {
  id: string;
  name: string;
  color: string | null;
}

export async function getCollectionOptions(userId: string): Promise<CollectionOption[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const typesByCollection = await getItemTypeCountsByCollection(collections.map((c) => c.id));

  return collections.map((c) => {
    const dominantType = [...(typesByCollection.get(c.id)?.values() ?? [])].sort(
      (a, b) => b.count - a.count,
    )[0];
    return { id: c.id, name: c.name, color: dominantType?.type.color ?? null };
  });
}

// Maps collectionId -> dominant item type color, for displaying a collection
// swatch outside of this module (e.g. on an item's collection badges)
export async function getDominantColors(collectionIds: string[]): Promise<Map<string, string>> {
  const typesByCollection = await getItemTypeCountsByCollection(collectionIds);
  const colors = new Map<string, string>();
  for (const [collectionId, typeCountMap] of typesByCollection) {
    const dominant = [...typeCountMap.values()].sort((a, b) => b.count - a.count)[0];
    if (dominant) colors.set(collectionId, dominant.type.color);
  }
  return colors;
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { totalCollections, favoriteCollections };
}

// Counts item types per collection (via the ItemCollection join table) so the
// most-used type's color can act as a stand-in "dominant color" for a collection —
// there's no user-set collection color, so this is derived on the fly.
async function getItemTypeCountsByCollection(
  collectionIds: string[]
): Promise<Map<string, Map<string, { count: number; type: CollectionItemType }>>> {
  if (collectionIds.length === 0) return new Map();

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
  return typesByCollection;
}

const collectionSummarySelect = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  _count: { select: { items: true } },
} as const;

type CollectionSummaryRow = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  _count: { items: number };
};

// Attaches item-type breakdown + dominant color to raw collection rows
async function withDominantColorInfo(
  collections: CollectionSummaryRow[]
): Promise<DashboardCollection[]> {
  const typesByCollection = await getItemTypeCountsByCollection(collections.map((c) => c.id));

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

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: collectionSummarySelect,
  });

  return withDominantColorInfo(collections);
}

export async function getAllCollections(userId: string): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: collectionSummarySelect,
  });

  return withDominantColorInfo(collections);
}

export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
}

// Returns null if the collection doesn't exist or isn't owned by the user, preventing IDOR
export async function getCollectionDetail(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      _count: { select: { items: true } },
    },
  });
  if (!collection) return null;

  const dominantColors = await getDominantColors([collection.id]);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection._count.items,
    dominantColor: dominantColors.get(collection.id) ?? null,
  };
}
