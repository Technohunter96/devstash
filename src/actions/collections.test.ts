import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCollection } from "./collections";

const mockAuth = vi.fn();
const mockCreateCollectionInDb = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollectionInDb: (...args: unknown[]) => mockCreateCollectionInDb(...args),
}));

const VALID_PAYLOAD = {
  name: "React Patterns",
  description: "Reusable hooks and components",
};

const COLLECTION = {
  id: "collection-1",
  name: "React Patterns",
  description: "Reusable hooks and components",
  isFavorite: false,
  itemCount: 0,
  itemTypes: [],
  dominantColor: null,
  updatedAt: new Date(),
};

describe("createCollection", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockCreateCollectionInDb.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createCollection(VALID_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCreateCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await createCollection(VALID_PAYLOAD);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCreateCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns validation error when name is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await createCollection({ ...VALID_PAYLOAD, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toHaveProperty("name");
  });

  it("returns validation error when name is whitespace only", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await createCollection({ ...VALID_PAYLOAD, name: "   " });
    expect(result.success).toBe(false);
  });

  it("returns success with collection data on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateCollectionInDb.mockResolvedValue(COLLECTION);
    const result = await createCollection(VALID_PAYLOAD);
    expect(result).toEqual({ success: true, data: COLLECTION });
  });

  it("passes userId and parsed data to createCollectionInDb", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockCreateCollectionInDb.mockResolvedValue(COLLECTION);
    await createCollection(VALID_PAYLOAD);
    expect(mockCreateCollectionInDb).toHaveBeenCalledWith(
      "user-42",
      expect.objectContaining({ name: "React Patterns", description: "Reusable hooks and components" }),
    );
  });

  it("converts empty description to null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateCollectionInDb.mockResolvedValue(COLLECTION);
    await createCollection({ ...VALID_PAYLOAD, description: "" });
    expect(mockCreateCollectionInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ description: null }),
    );
  });

  it("converts missing description to null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateCollectionInDb.mockResolvedValue(COLLECTION);
    await createCollection({ name: "React Patterns" });
    expect(mockCreateCollectionInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ description: null }),
    );
  });
});