import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDominantColors, getCollectionOptions } from "./collections";

const mockCollectionFindMany = vi.fn();
const mockItemCollectionFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany: (...args: unknown[]) => mockCollectionFindMany(...args),
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
