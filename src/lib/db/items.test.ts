import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFavoriteItems, getItemById, getItemsByCollection, getItemsByType } from "./items";

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockGetDominantColors = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  getDominantColors: (...args: unknown[]) => mockGetDominantColors(...args),
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
    mockGetDominantColors.mockReset();
    mockGetDominantColors.mockResolvedValue(new Map());
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

  it("maps collection to its dominant color", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
    });
    mockGetDominantColors.mockResolvedValue(new Map([["col-1", "#3b82f6"]]));
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections).toEqual([
      { id: "col-1", name: "React Patterns", color: "#3b82f6" },
    ]);
  });

  it("sets color to null when the collection has no dominant color", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [{ collection: { id: "col-2", name: "No Type Collection" } }],
    });
    mockGetDominantColors.mockResolvedValue(new Map());
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections[0].color).toBeNull();
  });

  it("flattens multiple collections preserving order", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [
        { collection: { id: "col-1", name: "First" } },
        { collection: { id: "col-2", name: "Second" } },
      ],
    });
    mockGetDominantColors.mockResolvedValue(new Map([["col-1", "#ff0000"]]));
    const result = await getItemById("user-1", "item-1");
    expect(result?.collections).toHaveLength(2);
    expect(result?.collections[0]).toEqual({ id: "col-1", name: "First", color: "#ff0000" });
    expect(result?.collections[1]).toEqual({ id: "col-2", name: "Second", color: null });
  });

  it("passes the item's collection IDs to getDominantColors", async () => {
    mockFindFirst.mockResolvedValue({
      ...BASE_ITEM,
      collections: [
        { collection: { id: "col-1", name: "First" } },
        { collection: { id: "col-2", name: "Second" } },
      ],
    });
    await getItemById("user-1", "item-1");
    expect(mockGetDominantColors).toHaveBeenCalledWith(["col-1", "col-2"]);
  });
});

describe("getFavoriteItems", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("scopes the query to the given userId and isFavorite: true, sorted by updatedAt desc", async () => {
    mockFindMany.mockResolvedValue([]);
    await getFavoriteItems("user-1");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isFavorite: true },
        orderBy: { updatedAt: "desc" },
      })
    );
  });

  it("returns the favorited items as-is", async () => {
    mockFindMany.mockResolvedValue([BASE_ITEM]);
    const result = await getFavoriteItems("user-1");
    expect(result).toEqual([BASE_ITEM]);
  });
});

describe("getItemsByCollection", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockCount.mockResolvedValue(0);
  });

  it("scopes the query to the given userId and collection membership, preventing IDOR", async () => {
    mockFindMany.mockResolvedValue([]);
    await getItemsByCollection("user-1", "col-1");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", collections: { some: { collectionId: "col-1" } } },
      })
    );
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", collections: { some: { collectionId: "col-1" } } },
      })
    );
  });

  it("returns the items and total count from the query", async () => {
    mockFindMany.mockResolvedValue([BASE_ITEM]);
    mockCount.mockResolvedValue(1);
    const result = await getItemsByCollection("user-1", "col-1");
    expect(result).toEqual({ data: [BASE_ITEM], totalCount: 1 });
  });

  it("defaults to the first page (no skip)", async () => {
    mockFindMany.mockResolvedValue([]);
    await getItemsByCollection("user-1", "col-1");
    const call = mockFindMany.mock.calls[0][0];
    expect(call.skip).toBe(0);
    expect(call.take).toBe(15);
  });

  it("computes skip from the given page number", async () => {
    mockFindMany.mockResolvedValue([]);
    await getItemsByCollection("user-1", "col-1", 3);
    const call = mockFindMany.mock.calls[0][0];
    expect(call.skip).toBe(30);
    expect(call.take).toBe(15);
  });
});

describe("getItemsByType", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockCount.mockResolvedValue(0);
  });

  it("scopes the query to the given userId and type name", async () => {
    mockFindMany.mockResolvedValue([]);
    await getItemsByType("user-1", "Snippet");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", itemType: { name: "Snippet" } },
      })
    );
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", itemType: { name: "Snippet" } },
      })
    );
  });

  it("returns the items and total count from the query", async () => {
    mockFindMany.mockResolvedValue([BASE_ITEM]);
    mockCount.mockResolvedValue(1);
    const result = await getItemsByType("user-1", "Snippet");
    expect(result).toEqual({ data: [BASE_ITEM], totalCount: 1 });
  });

  it("computes skip from the given page number", async () => {
    mockFindMany.mockResolvedValue([]);
    await getItemsByType("user-1", "Snippet", 2);
    const call = mockFindMany.mock.calls[0][0];
    expect(call.skip).toBe(15);
    expect(call.take).toBe(15);
  });
});