import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItemById } from "./items";

const mockFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

const BASE_ITEM = {
  id: "item-1",
  title: "Test Item",
  description: "A test item",
  contentType: "TEXT" as const,
  content: "console.log('hello')",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  language: "javascript",
  isFavorite: false,
  isPinned: false,
  lastUsedAt: new Date("2025-01-01"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" },
  tags: [{ id: "tag-1", name: "react" }],
  collections: [],
};

describe("getItemById", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it("returns null when item not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await getItemById("user-1", "item-999");
    expect(result).toBeNull();
  });

  it("passes userId and itemId to the query", async () => {
    mockFindFirst.mockResolvedValue({ ...BASE_ITEM, collections: [] });
    await getItemById("user-abc", "item-xyz");
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-xyz", userId: "user-abc" },
      })
    );
  });

  it("returns empty collections array when item has no collections", async () => {
    mockFindFirst.mockResolvedValue({ ...BASE_ITEM, collections: [] });
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections).toEqual([]);
  });

  it("maps collection with a defaultType color correctly", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [
        {
          collection: {
            id: "col-1",
            name: "React Patterns",
            defaultType: { color: "#3b82f6" },
          },
        },
      ],
    });
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections).toEqual([
      { id: "col-1", name: "React Patterns", color: "#3b82f6" },
    ]);
  });

  it("sets color to null when collection has no defaultType", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [
        {
          collection: {
            id: "col-2",
            name: "No Type Collection",
            defaultType: null,
          },
        },
      ],
    });
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections[0].color).toBeNull();
  });

  it("flattens multiple collections preserving order", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [
        { collection: { id: "col-1", name: "First", defaultType: { color: "#ff0000" } } },
        { collection: { id: "col-2", name: "Second", defaultType: null } },
      ],
    });
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections).toHaveLength(2);
    expect(result?.collections[0]).toEqual({ id: "col-1", name: "First", color: "#ff0000" });
    expect(result?.collections[1]).toEqual({ id: "col-2", name: "Second", color: null });
  });
});