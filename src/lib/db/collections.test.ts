import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDominantColors,
  getCollectionOptions,
  getAllCollections,
  getCollectionDetail,
} from "./collections";

const mockCollectionFindMany = vi.fn();
const mockCollectionFindFirst = vi.fn();
const mockItemCollectionFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany: (...args: unknown[]) => mockCollectionFindMany(...args),
      findFirst: (...args: unknown[]) => mockCollectionFindFirst(...args),
    },
    itemCollection: {
      findMany: (...args: unknown[]) => mockItemCollectionFindMany(...args),
    },
  },
}));

describe("getDominantColors", () => {
  beforeEach(() => {
    mockItemCollectionFindMany.mockReset();
  });

  it("returns an empty map without querying when no collection IDs are given", async () => {
    const result = await getDominantColors([]);
    expect(result.size).toBe(0);
    expect(mockItemCollectionFindMany).not.toHaveBeenCalled();
  });

  it("maps a collection to its only item type's color", async () => {
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
    ]);
    const result = await getDominantColors(["col-1"]);
    expect(result.get("col-1")).toBe("#3b82f6");
  });

  it("picks the most frequent item type's color as dominant", async () => {
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
      { collectionId: "col-1", item: { itemType: { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" } } },
    ]);
    const result = await getDominantColors(["col-1"]);
    expect(result.get("col-1")).toBe("#3b82f6");
  });

  it("omits collections with no linked items", async () => {
    mockItemCollectionFindMany.mockResolvedValue([]);
    const result = await getDominantColors(["col-1"]);
    expect(result.has("col-1")).toBe(false);
  });

  it("computes colors independently for multiple collections", async () => {
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
      { collectionId: "col-2", item: { itemType: { name: "Link", icon: "Link", color: "#10b981" } } },
    ]);
    const result = await getDominantColors(["col-1", "col-2"]);
    expect(result.get("col-1")).toBe("#3b82f6");
    expect(result.get("col-2")).toBe("#10b981");
  });
});

describe("getCollectionOptions", () => {
  beforeEach(() => {
    mockCollectionFindMany.mockReset();
    mockItemCollectionFindMany.mockReset();
  });

  it("returns collections with null color when they have no items", async () => {
    mockCollectionFindMany.mockResolvedValue([{ id: "col-1", name: "Empty Collection" }]);
    mockItemCollectionFindMany.mockResolvedValue([]);
    const result = await getCollectionOptions("user-1");
    expect(result).toEqual([{ id: "col-1", name: "Empty Collection", color: null }]);
  });

  it("maps each collection to its dominant color", async () => {
    mockCollectionFindMany.mockResolvedValue([
      { id: "col-1", name: "React Patterns" },
      { id: "col-2", name: "Links" },
    ]);
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
      { collectionId: "col-2", item: { itemType: { name: "Link", icon: "Link", color: "#10b981" } } },
    ]);
    const result = await getCollectionOptions("user-1");
    expect(result).toEqual([
      { id: "col-1", name: "React Patterns", color: "#3b82f6" },
      { id: "col-2", name: "Links", color: "#10b981" },
    ]);
  });

  it("scopes the query to the given userId", async () => {
    mockCollectionFindMany.mockResolvedValue([]);
    await getCollectionOptions("user-42");
    expect(mockCollectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-42" } })
    );
  });

  it("returns an empty array and skips the item-type query when the user has no collections", async () => {
    mockCollectionFindMany.mockResolvedValue([]);
    const result = await getCollectionOptions("user-1");
    expect(result).toEqual([]);
    expect(mockItemCollectionFindMany).not.toHaveBeenCalled();
  });
});

describe("getAllCollections", () => {
  beforeEach(() => {
    mockCollectionFindMany.mockReset();
    mockItemCollectionFindMany.mockReset();
  });

  it("scopes the query to the given userId with no take limit", async () => {
    mockCollectionFindMany.mockResolvedValue([]);
    await getAllCollections("user-42");
    const call = mockCollectionFindMany.mock.calls[0][0];
    expect(call.where).toEqual({ userId: "user-42" });
    expect(call.take).toBeUndefined();
  });

  it("attaches item type breakdown and dominant color to each collection", async () => {
    mockCollectionFindMany.mockResolvedValue([
      {
        id: "col-1",
        name: "React Patterns",
        description: null,
        isFavorite: false,
        updatedAt: new Date("2025-01-01"),
        _count: { items: 3 },
      },
    ]);
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" } } },
    ]);
    const result = await getAllCollections("user-1");
    expect(result).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        description: null,
        isFavorite: false,
        itemCount: 3,
        itemTypes: [{ name: "Snippet", icon: "Code", color: "#3b82f6" }],
        dominantColor: "#3b82f6",
        updatedAt: new Date("2025-01-01"),
      },
    ]);
  });
});

describe("getCollectionDetail", () => {
  beforeEach(() => {
    mockCollectionFindFirst.mockReset();
    mockItemCollectionFindMany.mockReset();
  });

  it("returns null when the collection doesn't exist or isn't owned by the user", async () => {
    mockCollectionFindFirst.mockResolvedValue(null);
    const result = await getCollectionDetail("user-1", "col-999");
    expect(result).toBeNull();
  });

  it("scopes the lookup to the collection id and userId, preventing IDOR", async () => {
    mockCollectionFindFirst.mockResolvedValue(null);
    await getCollectionDetail("user-1", "col-1");
    expect(mockCollectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col-1", userId: "user-1" } })
    );
  });

  it("returns collection detail with dominant color when found", async () => {
    mockCollectionFindFirst.mockResolvedValue({
      id: "col-1",
      name: "DevOps",
      description: "Ops stuff",
      isFavorite: true,
      _count: { items: 5 },
    });
    mockItemCollectionFindMany.mockResolvedValue([
      { collectionId: "col-1", item: { itemType: { name: "Command", icon: "Terminal", color: "#f97316" } } },
    ]);
    const result = await getCollectionDetail("user-1", "col-1");
    expect(result).toEqual({
      id: "col-1",
      name: "DevOps",
      description: "Ops stuff",
      isFavorite: true,
      itemCount: 5,
      dominantColor: "#f97316",
    });
  });

  it("sets dominantColor to null when the collection has no items", async () => {
    mockCollectionFindFirst.mockResolvedValue({
      id: "col-2",
      name: "Empty",
      description: null,
      isFavorite: false,
      _count: { items: 0 },
    });
    mockItemCollectionFindMany.mockResolvedValue([]);
    const result = await getCollectionDetail("user-1", "col-2");
    expect(result?.dominantColor).toBeNull();
  });
});
