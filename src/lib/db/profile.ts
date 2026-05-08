import { prisma } from "@/lib/prisma";

export interface ProfileUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  hasPassword: boolean;
}

export interface ItemTypeCount {
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  itemTypeCounts: ItemTypeCount[];
}

export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.password,
  };
}

const SYSTEM_TYPE_ORDER = [
  "Snippet", "Prompt", "Command", "Note", "Link", "File", "Image",
];

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, systemTypes, itemsWithTypes] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { name: true, icon: true, color: true },
    }),
    prisma.item.findMany({
      where: { userId },
      select: {
        itemType: { select: { name: true } },
      },
    }),
  ]);

  // Count items per type name
  const countMap = new Map<string, number>();
  for (const item of itemsWithTypes) {
    const name = item.itemType.name;
    countMap.set(name, (countMap.get(name) ?? 0) + 1);
  }

  // Merge all system types (including 0-count ones), sorted by SYSTEM_TYPE_ORDER
  const order = (name: string) => {
    const i = SYSTEM_TYPE_ORDER.indexOf(name);
    return i === -1 ? 99 : i;
  };

  const itemTypeCounts: ItemTypeCount[] = systemTypes
    .sort((a, b) => order(a.name) - order(b.name))
    .map(({ name, icon, color }) => ({
      name,
      icon,
      color,
      count: countMap.get(name) ?? 0,
    }));

  return { totalItems, totalCollections, itemTypeCounts };
}
