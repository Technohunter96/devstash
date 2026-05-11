import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/components/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/actions/**"],
      exclude: ["src/lib/prisma.ts", "src/lib/resend.ts", "src/lib/mock-data.ts"],
    },
  },
});