import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // DATABASE_URL is required for migrations; for prisma generate it is not used
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/devstash",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
