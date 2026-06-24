import { prisma } from "@/lib/prisma";

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
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  itemType: {
    select: { name: true, icon: true, color: true },
  },
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

  const updated = await prisma.item.update({
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
          collection: {
            select: {
              id: true,
              name: true,
              defaultType: { select: { color: true } },
            },
          },
        },
      },
    },
  });

  return {
    ...updated,
    collections: updated.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: c.collection.defaultType?.color ?? null,
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
    },
  });

  return { ...created, collections: [] };
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
          collection: {
            select: {
              id: true,
              name: true,
              defaultType: { select: { color: true } },
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  return {
    ...item,
    collections: item.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: c.collection.defaultType?.color ?? null,
    })),
  };
}