import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSearchData } from "./search";

const mockAuth = vi.fn();
const mockGetSearchItems = vi.fn();
const mockGetSearchCollections = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/search", () => ({
  getSearchItems: (...args: unknown[]) => mockGetSearchItems(...args),
  getSearchCollections: (...args: unknown[]) => mockGetSearchCollections(...args),
}));

const MOCK_ITEMS = [
  { id: "item-1", title: "Git Stash", description: "Save work in progress", typeName: "Command", typeIcon: "Terminal", typeColor: "#f97316", contentPreview: "git stash" },
];

const MOCK_COLLECTIONS = [
  { id: "col-1", name: "Terminal Commands", itemCount: 4, dominantColor: "#f97316" },
];

describe("getSearchData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty arrays when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await getSearchData();

    expect(result).toEqual({ items: [], collections: [] });
    expect(mockGetSearchItems).not.toHaveBeenCalled();
    expect(mockGetSearchCollections).not.toHaveBeenCalled();
  });

  it("returns empty arrays when session has no user id", async () => {
    mockAuth.mockResolvedValueOnce({ user: {} });

    const result = await getSearchData();

    expect(result).toEqual({ items: [], collections: [] });
  });

  it("returns items and collections for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockGetSearchItems.mockResolvedValueOnce(MOCK_ITEMS);
    mockGetSearchCollections.mockResolvedValueOnce(MOCK_COLLECTIONS);

    const result = await getSearchData();

    expect(result).toEqual({ items: MOCK_ITEMS, collections: MOCK_COLLECTIONS });
  });

  it("calls DB functions with the user id from session", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-42" } });
    mockGetSearchItems.mockResolvedValueOnce([]);
    mockGetSearchCollections.mockResolvedValueOnce([]);

    await getSearchData();

    expect(mockGetSearchItems).toHaveBeenCalledWith("user-42");
    expect(mockGetSearchCollections).toHaveBeenCalledWith("user-42");
  });
});
