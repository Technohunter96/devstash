import { prisma } from "@/lib/prisma";
import { getDominantColors } from "@/lib/db/collections";

export const ITEM_TYPE_ORDER: string[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "Link",
  "File",
  "Image",
];

// Maps URL slug (e.g. "snippets") to system type name (e.g. "Snippet")
export const SLUG_TO_TYPE_NAME: Record<string, string> = {
  snippets: "Snippet",
  prompts: "Prompt",
  commands: "Command",
  notes: "Note",
  links: "Link",
  files: "File",
  images: "Image",
};

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
  tags: { id: string; name: string }[];
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  createdAt: true,
  itemType: {
    select: { name: true, icon: true, color: true },
  },
  tags: { select: { id: true, name: true } },
} as const;

export async function getPinnedItems(userId: string): Promise<DashboardItem[]> {
  return prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  });
}

export async function getRecentItems(
  userId: string,
  limit = 10
): Promise<DashboardItem[]> {
  return prisma.item.findMany({
    where: { userId },
    orderBy: { lastUsedAt: { sort: "desc", nulls: "last" } },
    take: limit,
    select: itemSelect,
  });
}

export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<DashboardItem[]> {
  return prisma.item.findMany({
    where: { userId, itemType: { name: typeName } },
    orderBy: { lastUsedAt: { sort: "desc", nulls: "last" } },
    select: itemSelect,
  });
}

export async function getItemsByCollection(
  userId: string,
  collectionId: string
): Promise<DashboardItem[]> {
  return prisma.item.findMany({
    where: { userId, collections: { some: { collectionId } } },
    orderBy: { lastUsedAt: { sort: "desc", nulls: "last" } },
    select: itemSelect,
  });
}

export async function getItemStats(userId: string): Promise<{
  totalItems: number;
  favoriteItems: number;
}> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  itemType: { name: string; icon: string; color: string };
  tags: { id: string; name: string }[];
  collections: { id: string; name: string; color: string | null }[];
}

export interface CreateItemData {
  typeName: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
  // File/Image upload fields — set after uploading to R2
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
}

// Filters out collection IDs that don't belong to the user, preventing IDOR via crafted IDs
async function getOwnedCollectionIds(userId: string, collectionIds: string[]): Promise<string[]> {
  if (collectionIds.length === 0) return [];
  const owned = await prisma.collection.findMany({
    where: { id: { in: collectionIds }, userId },
    select: { id: true },
  });
  return owned.map((c) => c.id);
}

export async function updateItemById(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const ownedCollectionIds = await getOwnedCollectionIds(userId, data.collectionIds);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.itemCollection.deleteMany({ where: { itemId } });
    if (ownedCollectionIds.length > 0) {
      await tx.itemCollection.createMany({
        data: ownedCollectionIds.map((collectionId) => ({ itemId, collectionId })),
      });
    }

    return tx.item.update({
      where: { id: itemId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        tags: {
          set: [],
          connectOrCreate: data.tags.map((name) => ({
            where: { name_userId: { name, userId } },
            create: { name, userId },
          })),
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        content: true,
        url: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        language: true,
        isFavorite: true,
        isPinned: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        itemType: { select: { name: true, icon: true, color: true } },
        tags: { select: { id: true, name: true } },
        collections: {
          select: {
            collection: { select: { id: true, name: true } },
          },
        },
      },
    });
  });

  const dominantColors = await getDominantColors(updated.collections.map((c) => c.collection.id));

  return {
    ...updated,
    collections: updated.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: dominantColors.get(c.collection.id) ?? null,
    })),
  };
}

export async function createItemInDb(
  userId: string,
  data: CreateItemData
): Promise<ItemDetail> {
  const itemType = await prisma.itemType.findFirstOrThrow({
    where: { name: data.typeName, isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  });

  // Determine content mode based on item type
  const FILE_TYPES = ["File", "Image"];
  const contentType = FILE_TYPES.includes(data.typeName)
    ? ("FILE" as const)
    : data.typeName === "Link"
      ? ("URL" as const)
      : ("TEXT" as const);

  const ownedCollectionIds = await getOwnedCollectionIds(userId, data.collectionIds);

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      language: data.language,
      contentType,
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name_userId: { name, userId } },
          create: { name, userId },
        })),
      },
      collections: {
        create: ownedCollectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      contentType: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: {
          collection: { select: { id: true, name: true } },
        },
      },
    },
  });

  const dominantColors = await getDominantColors(created.collections.map((c) => c.collection.id));

  return {
    ...created,
    collections: created.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: dominantColors.get(c.collection.id) ?? null,
    })),
  };
}

// Deletes an item and returns its fileUrl (if any) for R2 cleanup
export async function deleteItemById(
  userId: string,
  itemId: string
): Promise<{ deleted: boolean; fileUrl: string | null }> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true },
  });
  if (!item) return { deleted: false, fileUrl: null };

  await prisma.item.delete({ where: { id: itemId } });
  return { deleted: true, fileUrl: item.fileUrl };
}

export async function getItemById(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      contentType: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: {
          collection: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!item) return null;

  const dominantColors = await getDominantColors(item.collections.map((c) => c.collection.id));

  return {
    ...item,
    collections: item.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: dominantColors.get(c.collection.id) ?? null,
    })),
  };
}