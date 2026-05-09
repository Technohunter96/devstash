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