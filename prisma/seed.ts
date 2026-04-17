import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── System Item Types ────────────────────────────────────────────────────────

const SYSTEM_TYPES = [
  { name: "Snippet", icon: "Code", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "Note", icon: "StickyNote", color: "#fde047" },
  { name: "File", icon: "File", color: "#6b7280" },
  { name: "Image", icon: "Image", color: "#ec4899" },
  { name: "Link", icon: "Link", color: "#10b981" },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");

  // 1. System item types
  console.log("→ System item types");
  const typeMap: Record<string, string> = {};
  for (const t of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: t.name, isSystem: true, userId: null },
    });
    const record = existing ?? (await prisma.itemType.create({
      data: { name: t.name, icon: t.icon, color: t.color, isSystem: true, userId: null },
    }));
    typeMap[t.name] = record.id;
    console.log(`  ${existing ? "skip" : "create"} ${t.name}`);
  }

  // 2. Demo user
  console.log("\n→ Demo user");
  const passwordHash = await bcrypt.hash("12345678", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });
  console.log(`  ${user.email}`);

  // 3. Collections + Items
  console.log("\n→ Collections & items");

  // ── React Patterns ──────────────────────────────────────────────────────────
  const reactPatterns = await upsertCollection(user.id, {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
  });

  const now = new Date();
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  await upsertItem(user.id, typeMap["Snippet"], reactPatterns.id, {
    title: "Custom Hooks",
    lastUsedAt: minsAgo(12),
    isFavorite: true,
    content: `import { useState, useEffect, useCallback, useRef } from "react";

// useDebounce — delays updating a value until after a delay
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useLocalStorage — persisted state backed by localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStored((prev) => {
      const next = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [stored, setValue] as const;
}

// usePrevious — track the previous value of a variable
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}`,
    language: "typescript",
  });

  await upsertItem(user.id, typeMap["Snippet"], reactPatterns.id, {
    title: "Component Patterns",
    lastUsedAt: hoursAgo(3),
    content: `import { createContext, useContext, useState, type ReactNode } from "react";

// ── Context Provider pattern ────────────────────────────────────────────────
interface ThemeContextValue {
  theme: "light" | "dark";
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// ── Compound component pattern ──────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string }

function Card({ children, className }: CardProps) {
  return <div className={\`rounded-lg border \${className}\`}>{children}</div>;
}
Card.Header = ({ children }: { children: ReactNode }) => (
  <div className="border-b p-4 font-semibold">{children}</div>
);
Card.Body = ({ children }: { children: ReactNode }) => (
  <div className="p-4">{children}</div>
);

export { Card };`,
    language: "typescript",
  });

  await upsertItem(user.id, typeMap["Snippet"], reactPatterns.id, {
    title: "Utility Functions",
    lastUsedAt: hoursAgo(7),
    content: `// cn — merge Tailwind classes safely (clsx + tailwind-merge)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatDate — locale-aware date formatting
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(new Date(date));
}

// truncate — shorten a string with ellipsis
export function truncate(str: string, length = 80) {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

// sleep — promise-based delay (useful in async flows)
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// groupBy — group array of objects by a key
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key]);
    return { ...acc, [group]: [...(acc[group] ?? []), item] };
  }, {} as Record<string, T[]>);
}`,
    language: "typescript",
  });

  // ── AI Workflows ────────────────────────────────────────────────────────────
  const aiWorkflows = await upsertCollection(user.id, {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
  });

  await upsertItem(user.id, typeMap["Prompt"], aiWorkflows.id, {
    title: "Code Review Prompt",
    lastUsedAt: daysAgo(1),
    isFavorite: true,
    content: `You are a senior software engineer conducting a thorough code review.

Review the following code and provide feedback on:
1. **Correctness** — logic errors, edge cases, off-by-one errors
2. **Security** — injections, exposed secrets, improper auth checks
3. **Performance** — unnecessary re-renders, N+1 queries, blocking operations
4. **Readability** — naming, complexity, missing abstractions
5. **Best practices** — patterns, conventions, framework-specific guidelines

Format your response as:
- 🔴 **Critical** — must fix before merging
- 🟡 **Warning** — should fix soon
- 🟢 **Suggestion** — optional improvement

Code to review:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
  });

  await upsertItem(user.id, typeMap["Prompt"], aiWorkflows.id, {
    title: "Documentation Generator",
    lastUsedAt: daysAgo(2),
    content: `Generate comprehensive documentation for the following code.

Include:
- **Purpose** — what this code does and why it exists
- **Parameters / Props** — name, type, description, whether required
- **Return value** — type and description
- **Usage examples** — 2-3 practical examples with real-looking data
- **Edge cases** — known limitations or gotchas

Output as Markdown. Keep it concise but complete.

Code:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
  });

  await upsertItem(user.id, typeMap["Prompt"], aiWorkflows.id, {
    title: "Refactoring Assistant",
    lastUsedAt: daysAgo(3),
    content: `You are an expert at refactoring code for clarity, maintainability, and performance.

Refactor the code below following these principles:
- Extract repeated logic into named functions
- Replace magic numbers/strings with named constants
- Simplify conditionals and reduce nesting
- Apply the single responsibility principle
- Preserve all existing functionality — do not change behavior

After the refactored code, add a short "Changes made" section explaining each change.

Original code:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
  });

  // ── DevOps ──────────────────────────────────────────────────────────────────
  const devops = await upsertCollection(user.id, {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
  });

  await upsertItem(user.id, typeMap["Snippet"], devops.id, {
    title: "Docker + GitHub Actions CI",
    lastUsedAt: daysAgo(4),
    content: `# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
    language: "yaml",
  });

  await upsertItem(user.id, typeMap["Command"], devops.id, {
    title: "Deploy to Production",
    lastUsedAt: daysAgo(5),
    content: `# Pull latest image and restart container
docker pull ghcr.io/your-org/your-app:latest
docker stop app || true
docker rm app || true
docker run -d \\
  --name app \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  --env-file .env.production \\
  ghcr.io/your-org/your-app:latest`,
    language: "bash",
  });

  await upsertItem(user.id, typeMap["Link"], devops.id, {
    title: "Docker Documentation",
    lastUsedAt: daysAgo(6),
    url: "https://docs.docker.com",
    contentType: "URL",
  });

  await upsertItem(user.id, typeMap["Link"], devops.id, {
    title: "GitHub Actions Docs",
    lastUsedAt: daysAgo(7),
    url: "https://docs.github.com/en/actions",
    contentType: "URL",
  });

  // ── Terminal Commands ────────────────────────────────────────────────────────
  const terminal = await upsertCollection(user.id, {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
  });

  await upsertItem(user.id, typeMap["Command"], terminal.id, {
    title: "Git Operations",
    lastUsedAt: minsAgo(45),
    isFavorite: true,
    content: `# Undo last commit but keep changes staged
git reset --soft HEAD~1

# Interactively stage hunks
git add -p

# Pretty git log with graph
git log --oneline --graph --decorate --all

# Find which commit introduced a bug
git bisect start
git bisect bad          # current commit is broken
git bisect good v1.0.0  # last known good tag

# Clean up merged local branches
git branch --merged main | grep -v main | xargs git branch -d`,
    language: "bash",
  });

  await upsertItem(user.id, typeMap["Command"], terminal.id, {
    title: "Docker Commands",
    lastUsedAt: hoursAgo(5),
    content: `# Remove all stopped containers, unused images, networks, caches
docker system prune -af

# Show live resource usage per container
docker stats

# Open a shell in a running container
docker exec -it <container> sh

# Tail logs with timestamps
docker logs -f --timestamps <container>

# Copy file from container to host
docker cp <container>:/app/file.txt ./file.txt`,
    language: "bash",
  });

  await upsertItem(user.id, typeMap["Command"], terminal.id, {
    title: "Process Management",
    lastUsedAt: daysAgo(2),
    content: `# Find process using a port (Linux/Mac)
lsof -i :3000

# Kill process on a port
kill -9 $(lsof -t -i :3000)

# Show top CPU/memory processes
ps aux --sort=-%cpu | head -10

# Monitor a log file in real time
tail -f /var/log/app.log | grep ERROR

# Run process in background, immune to hangups
nohup node server.js > output.log 2>&1 &`,
    language: "bash",
  });

  await upsertItem(user.id, typeMap["Command"], terminal.id, {
    title: "Package Manager Utilities",
    lastUsedAt: daysAgo(3),
    content: `# List outdated packages
npm outdated

# Update all packages to latest (respects semver)
npx npm-check-updates -u && npm install

# Audit and auto-fix vulnerabilities
npm audit fix

# Analyze bundle size
npx @next/bundle-analyzer

# Check why a package is installed
npm why <package>

# Clean install (delete node_modules first)
rm -rf node_modules package-lock.json && npm install`,
    language: "bash",
  });

  // ── Design Resources ─────────────────────────────────────────────────────────
  const design = await upsertCollection(user.id, {
    name: "Design Resources",
    description: "UI/UX resources and references",
  });

  await upsertItem(user.id, typeMap["Link"], design.id, {
    title: "Tailwind CSS Docs",
    lastUsedAt: hoursAgo(1),
    url: "https://tailwindcss.com/docs",
    contentType: "URL",
  });

  await upsertItem(user.id, typeMap["Link"], design.id, {
    title: "shadcn/ui Components",
    lastUsedAt: daysAgo(1),
    url: "https://ui.shadcn.com/docs/components",
    contentType: "URL",
  });

  await upsertItem(user.id, typeMap["Link"], design.id, {
    title: "Radix UI Primitives",
    lastUsedAt: daysAgo(4),
    url: "https://www.radix-ui.com/primitives",
    contentType: "URL",
  });

  await upsertItem(user.id, typeMap["Link"], design.id, {
    title: "Lucide Icons",
    lastUsedAt: daysAgo(6),
    url: "https://lucide.dev/icons",
    contentType: "URL",
  });

  console.log("\nDone.");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCollection(userId: string, data: { name: string; description: string }) {
  const existing = await prisma.collection.findFirst({ where: { userId, name: data.name } });
  if (existing) {
    console.log(`  skip collection: ${data.name}`);
    return existing;
  }
  console.log(`  create collection: ${data.name}`);
  return prisma.collection.create({ data: { ...data, userId } });
}

async function upsertItem(
  userId: string,
  itemTypeId: string,
  collectionId: string,
  data: {
    title: string;
    content?: string;
    url?: string;
    language?: string;
    contentType?: "URL" | "TEXT" | "FILE";
    lastUsedAt?: Date;
    isFavorite?: boolean;
  }
) {
  const existing = await prisma.item.findFirst({ where: { userId, title: data.title } });
  if (existing) {
    console.log(`    update item: ${data.title}`);
    await prisma.item.update({
      where: { id: existing.id },
      data: {
        lastUsedAt: data.lastUsedAt ?? null,
        isFavorite: data.isFavorite ?? false,
      },
    });
    if (!(await prisma.itemCollection.findUnique({ where: { itemId_collectionId: { itemId: existing.id, collectionId } } }))) {
      await prisma.itemCollection.create({ data: { itemId: existing.id, collectionId } });
    }
    return existing;
  }
  console.log(`    create item: ${data.title}`);
  return prisma.item.create({
    data: {
      title: data.title,
      content: data.content,
      url: data.url,
      language: data.language,
      contentType: data.contentType ?? "TEXT",
      lastUsedAt: data.lastUsedAt ?? null,
      isFavorite: data.isFavorite ?? false,
      userId,
      itemTypeId,
      collections: { create: { collectionId } },
    },
  });
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
