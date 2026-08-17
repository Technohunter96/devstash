import { describe, it, expect, vi, beforeEach } from "vitest";
import { createItem, updateItem, deleteItem, toggleItemFavorite } from "./items";

const mockAuth = vi.fn();
const mockCreateItemInDb = vi.fn();
const mockUpdateItemById = vi.fn();
const mockDeleteItemById = vi.fn();
const mockToggleItemFavoriteById = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/items", () => ({
  createItemInDb: (...args: unknown[]) => mockCreateItemInDb(...args),
  updateItemById: (...args: unknown[]) => mockUpdateItemById(...args),
  deleteItemById: (...args: unknown[]) => mockDeleteItemById(...args),
  toggleItemFavoriteById: (...args: unknown[]) => mockToggleItemFavoriteById(...args),
}));

const VALID_PAYLOAD = {
  title: "My Snippet",
  description: "A helpful snippet",
  content: "console.log('hi')",
  url: null,
  language: "typescript",
  tags: ["react", "hooks"],
};

const ITEM_DETAIL = {
  id: "item-1",
  title: "My Snippet",
  description: "A helpful snippet",
  contentType: "TEXT" as const,
  content: "console.log('hi')",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  language: "typescript",
  isFavorite: false,
  isPinned: false,
  lastUsedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" },
  tags: [{ id: "tag-1", name: "react" }, { id: "tag-2", name: "hooks" }],
  collections: [],
};

const VALID_CREATE_PAYLOAD = {
  typeName: "Snippet" as const,
  title: "My Snippet",
  description: "A helpful snippet",
  content: "console.log('hi')",
  url: null,
  language: "typescript",
  tags: ["react", "hooks"],
};

describe("createItem", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockCreateItemInDb.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createItem(VALID_CREATE_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await createItem(VALID_CREATE_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns validation error when title is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await createItem({ ...VALID_CREATE_PAYLOAD, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toHaveProperty("title");
  });

  it("returns validation error for invalid typeName", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await createItem({ ...VALID_CREATE_PAYLOAD, typeName: "InvalidType" });
    expect(result.success).toBe(false);
  });

  it("returns validation error for invalid URL on Link type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await createItem({ ...VALID_CREATE_PAYLOAD, typeName: "Link", url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("returns success with item data on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    const result = await createItem(VALID_CREATE_PAYLOAD);
    expect(result).toEqual({ success: true, data: ITEM_DETAIL });
  });

  it("passes userId and parsed data to createItemInDb", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    await createItem(VALID_CREATE_PAYLOAD);
    expect(mockCreateItemInDb).toHaveBeenCalledWith(
      "user-42",
      expect.objectContaining({ typeName: "Snippet", title: "My Snippet" }),
    );
  });

  it("filters empty strings from tags", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    await createItem({ ...VALID_CREATE_PAYLOAD, tags: ["react", "", "hooks"] });
    expect(mockCreateItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tags: ["react", "hooks"] }),
    );
  });

  it("converts empty description to null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    await createItem({ ...VALID_CREATE_PAYLOAD, description: "" });
    expect(mockCreateItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ description: null }),
    );
  });

  it("defaults collectionIds to an empty array when omitted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    await createItem(VALID_CREATE_PAYLOAD);
    expect(mockCreateItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ collectionIds: [] }),
    );
  });

  it("passes collectionIds through to createItemInDb", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValue(ITEM_DETAIL);
    await createItem({ ...VALID_CREATE_PAYLOAD, collectionIds: ["col-1", "col-2"] });
    expect(mockCreateItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ collectionIds: ["col-1", "col-2"] }),
    );
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDeleteItemById.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDeleteItemById).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDeleteItemById).not.toHaveBeenCalled();
  });

  it("returns item not found when deleteItemById returns not deleted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDeleteItemById.mockResolvedValue({ deleted: false, fileUrl: null });
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("returns success when deleteItemById returns deleted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDeleteItemById.mockResolvedValue({ deleted: true, fileUrl: null });
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: true });
  });

  it("passes userId and itemId to deleteItemById", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockDeleteItemById.mockResolvedValue({ deleted: true, fileUrl: null });
    await deleteItem("item-99");
    expect(mockDeleteItemById).toHaveBeenCalledWith("user-42", "item-99");
  });
});

describe("updateItem", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemById.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateItem("item-1", VALID_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateItemById).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await updateItem("item-1", VALID_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns validation error when title is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await updateItem("item-1", { ...VALID_PAYLOAD, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toHaveProperty("title");
    }
  });

  it("returns validation error when title is whitespace only", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await updateItem("item-1", { ...VALID_PAYLOAD, title: "   " });
    expect(result.success).toBe(false);
  });

  it("returns validation error for invalid URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await updateItem("item-1", { ...VALID_PAYLOAD, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts null url without error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    const result = await updateItem("item-1", { ...VALID_PAYLOAD, url: null });
    expect(result.success).toBe(true);
  });

  it("returns item not found when updateItemById returns null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(null);
    const result = await updateItem("item-1", VALID_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("returns success with item data on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    const result = await updateItem("item-1", VALID_PAYLOAD);
    expect(result).toEqual({ success: true, data: ITEM_DETAIL });
  });

  it("passes userId and itemId to updateItemById", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    await updateItem("item-99", VALID_PAYLOAD);
    expect(mockUpdateItemById).toHaveBeenCalledWith(
      "user-42",
      "item-99",
      expect.objectContaining({ title: "My Snippet" }),
    );
  });

  it("filters empty strings from tags array", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    await updateItem("item-1", { ...VALID_PAYLOAD, tags: ["react", "", "hooks"] });
    expect(mockUpdateItemById).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ tags: ["react", "hooks"] }),
    );
  });

  it("converts empty description to null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    await updateItem("item-1", { ...VALID_PAYLOAD, description: "" });
    expect(mockUpdateItemById).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ description: null }),
    );
  });

  it("defaults collectionIds to an empty array when omitted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    await updateItem("item-1", VALID_PAYLOAD);
    expect(mockUpdateItemById).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ collectionIds: [] }),
    );
  });

  it("passes collectionIds through to updateItemById", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItemById.mockResolvedValue(ITEM_DETAIL);
    await updateItem("item-1", { ...VALID_PAYLOAD, collectionIds: ["col-1"] });
    expect(mockUpdateItemById).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ collectionIds: ["col-1"] }),
    );
  });
});

describe("toggleItemFavorite", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockToggleItemFavoriteById.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockToggleItemFavoriteById).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockToggleItemFavoriteById).not.toHaveBeenCalled();
  });

  it("returns item not found when toggleItemFavoriteById returns null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemFavoriteById.mockResolvedValue(null);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("returns the new favorite state on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemFavoriteById.mockResolvedValue({ isFavorite: true });
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: true, isFavorite: true });
  });

  it("passes userId and itemId to toggleItemFavoriteById", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockToggleItemFavoriteById.mockResolvedValue({ isFavorite: false });
    await toggleItemFavorite("item-99");
    expect(mockToggleItemFavoriteById).toHaveBeenCalledWith("user-42", "item-99");
  });
});