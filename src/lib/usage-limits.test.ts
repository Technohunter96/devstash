import { describe, it, expect } from "vitest";
import { canCreateItem, canCreateCollection, canUploadFileType } from "./usage-limits";
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from "@/lib/constants/billing";

describe("canCreateItem", () => {
  it("allows when currentItemCount is below the free limit and not Pro", () => {
    expect(canCreateItem(FREE_ITEM_LIMIT - 1, false)).toEqual({ allowed: true });
  });

  it("blocks when currentItemCount equals the free limit and not Pro", () => {
    const result = canCreateItem(FREE_ITEM_LIMIT, false);
    expect(result.allowed).toBe(false);
  });

  it("blocks when currentItemCount exceeds the free limit and not Pro", () => {
    const result = canCreateItem(FREE_ITEM_LIMIT + 1, false);
    expect(result.allowed).toBe(false);
  });

  it("allows regardless of count when isPro is true", () => {
    expect(canCreateItem(FREE_ITEM_LIMIT + 100, true)).toEqual({ allowed: true });
  });

  it("returns a reason string on the blocked case", () => {
    const result = canCreateItem(FREE_ITEM_LIMIT, false);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/Upgrade to Pro/);
  });
});

describe("canCreateCollection", () => {
  it("allows when currentCollectionCount is below the free limit and not Pro", () => {
    expect(canCreateCollection(FREE_COLLECTION_LIMIT - 1, false)).toEqual({ allowed: true });
  });

  it("blocks when currentCollectionCount equals the free limit and not Pro", () => {
    const result = canCreateCollection(FREE_COLLECTION_LIMIT, false);
    expect(result.allowed).toBe(false);
  });

  it("blocks when currentCollectionCount exceeds the free limit and not Pro", () => {
    const result = canCreateCollection(FREE_COLLECTION_LIMIT + 1, false);
    expect(result.allowed).toBe(false);
  });

  it("allows regardless of count when isPro is true", () => {
    expect(canCreateCollection(FREE_COLLECTION_LIMIT + 100, true)).toEqual({ allowed: true });
  });

  it("returns a reason string on the blocked case", () => {
    const result = canCreateCollection(FREE_COLLECTION_LIMIT, false);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/Upgrade to Pro/);
  });
});

describe("canUploadFileType", () => {
  it("blocks File when not Pro", () => {
    expect(canUploadFileType("File", false).allowed).toBe(false);
  });

  it("blocks Image when not Pro", () => {
    expect(canUploadFileType("Image", false).allowed).toBe(false);
  });

  it("allows File when Pro", () => {
    expect(canUploadFileType("File", true)).toEqual({ allowed: true });
  });

  it("allows Image when Pro", () => {
    expect(canUploadFileType("Image", true)).toEqual({ allowed: true });
  });

  it("allows any other type name regardless of Pro status", () => {
    expect(canUploadFileType("Snippet", false)).toEqual({ allowed: true });
    expect(canUploadFileType("Link", false)).toEqual({ allowed: true });
  });
});