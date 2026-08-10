import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSearchItems, getSearchCollections } from "./search";

const mockFindMany = vi.fn();
const mockGetDominantColors = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    collection: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  getDominantColors: (...args: unknown[]) => mockGetDominantColors(...args),
}));

describe("getSearchItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns items with correct shape", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "item-1",
        title: "Git Operations",
        description: "Common git commands",
        content: "git status",
        itemType: { name: "Command", icon: "Terminal", color: "#f97316" },
      },
    ]);

    const result = await getSearchItems("user-1");

    expect(result).toEqual([
      {
        id: "item-1",
        title: "Git Operations",
        description: "Common git commands",
        typeName: "Command",
        typeIcon: "Terminal",
        typeColor: "#f97316",
        contentPreview: "git status",
      },
    ]);
  });

  it("returns null description when description is null", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "item-1",
        title: "No Desc",
        description: null,
        content: "some content",
        itemType: { name: "Note", icon: "StickyNote", color: "#fde047" },
      },
    ]);

    const result = await getSearchItems("user-1");

    expect(result[0].description).toBeNull();
  });

  it("truncates content preview to 120 characters", async () => {
    const longContent = "a".repeat(200);
    mockFindMany.mockResolvedValueOnce([
      {
        id: "item-1",
        title: "Long Item",
        description: null,
        content: longContent,
        itemType: { name: "Note", icon: "StickyNote", color: "#fde047" },
      },
    ]);

    const result = await getSearchItems("user-1");

    expect(result[0].contentPreview).toHaveLength(120);
  });

  it("returns null contentPreview when content is null", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "item-1",
        title: "A Link",
        description: null,
        content: null,
        itemType: { name: "Link", icon: "Link", color: "#10b981" },
      },
    ]);

    const result = await getSearchItems("user-1");

    expect(result[0].contentPreview).toBeNull();
  });

  it("returns empty array when user has no items", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const result = await getSearchItems("user-1");

    expect(result).toEqual([]);
  });
});

describe("getSearchCollections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns collections with correct shape", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "col-1",
        name: "React Patterns",
        _count: { items: 5 },
      },
    ]);
    mockGetDominantColors.mockResolvedValueOnce(new Map([["col-1", "#3b82f6"]]));

    const result = await getSearchCollections("user-1");

    expect(result).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        itemCount: 5,
        dominantColor: "#3b82f6",
      },
    ]);
  });

  it("returns null dominantColor when collection has no items", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "col-1",
        name: "Empty Collection",
        _count: { items: 0 },
      },
    ]);
    mockGetDominantColors.mockResolvedValueOnce(new Map());

    const result = await getSearchCollections("user-1");

    expect(result[0].dominantColor).toBeNull();
  });

  it("calls getDominantColors with collection ids", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "col-1", name: "A", _count: { items: 1 } },
      { id: "col-2", name: "B", _count: { items: 2 } },
    ]);
    mockGetDominantColors.mockResolvedValueOnce(new Map());

    await getSearchCollections("user-1");

    expect(mockGetDominantColors).toHaveBeenCalledWith(["col-1", "col-2"]);
  });

  it("returns empty array when user has no collections", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockGetDominantColors.mockResolvedValueOnce(new Map());

    const result = await getSearchCollections("user-1");

    expect(result).toEqual([]);
  });
});