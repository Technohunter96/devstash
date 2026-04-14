import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ITEM_TYPES = [
  { name: "Snippet", icon: "Code", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "Note", icon: "StickyNote", color: "#fde047" },
  { name: "Link", icon: "Link", color: "#10b981" },
  { name: "File", icon: "File", color: "#6b7280" },
  { name: "Image", icon: "Image", color: "#ec4899" },
];

async function main() {
  console.log("Seeding system item types...");

  for (const type of SYSTEM_ITEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, isSystem: true, userId: null },
    });

    if (!existing) {
      await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
          userId: null,
        },
      });
      console.log(`  Created: ${type.name}`);
    } else {
      console.log(`  Skipped (exists): ${type.name}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
