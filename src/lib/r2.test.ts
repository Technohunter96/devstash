// Tests for R2 utility functions — validateFile and generateR2Key

import { describe, it, expect } from "vitest";
import { validateFile, generateR2Key } from "./r2";

// Helper to create a mock File object
function mockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("validateFile", () => {
  // --- Image validation ---

  it("accepts a valid image file", () => {
    const file = mockFile("photo.png", 1024, "image/png");
    expect(validateFile(file, "Image")).toBeNull();
  });

  it("rejects image exceeding 5 MB", () => {
    const file = mockFile("big.png", 6 * 1024 * 1024, "image/png");
    expect(validateFile(file, "Image")).toContain("5 MB");
  });

  it("rejects image with invalid MIME type", () => {
    const file = mockFile("doc.pdf", 1024, "application/pdf");
    expect(validateFile(file, "Image")).toContain("not allowed");
  });

  it("rejects image with invalid extension", () => {
    const file = mockFile("image.bmp", 1024, "image/png");
    expect(validateFile(file, "Image")).toContain("not allowed");
  });

  it("accepts all valid image extensions", () => {
    const types: [string, string][] = [
      ["test.jpg", "image/jpeg"],
      ["test.jpeg", "image/jpeg"],
      ["test.gif", "image/gif"],
      ["test.webp", "image/webp"],
      ["test.svg", "image/svg+xml"],
    ];
    for (const [name, mime] of types) {
      expect(validateFile(mockFile(name, 1024, mime), "Image")).toBeNull();
    }
  });

  // --- File validation ---

  it("accepts a valid file", () => {
    const file = mockFile("readme.md", 1024, "text/markdown");
    expect(validateFile(file, "File")).toBeNull();
  });

  it("rejects file exceeding 10 MB", () => {
    const file = mockFile("big.pdf", 11 * 1024 * 1024, "application/pdf");
    expect(validateFile(file, "File")).toContain("10 MB");
  });

  it("rejects file with invalid MIME type", () => {
    const file = mockFile("script.js", 1024, "application/javascript");
    expect(validateFile(file, "File")).toContain("not allowed");
  });

  it("rejects file with no extension", () => {
    const file = mockFile("Makefile", 1024, "text/plain");
    expect(validateFile(file, "File")).toContain("not allowed");
  });

  it("accepts all valid file extensions", () => {
    const types: [string, string][] = [
      ["doc.pdf", "application/pdf"],
      ["doc.txt", "text/plain"],
      ["doc.json", "application/json"],
      ["doc.yaml", "application/x-yaml"],
      ["doc.yml", "text/yaml"],
      ["doc.xml", "application/xml"],
      ["doc.csv", "text/csv"],
    ];
    for (const [name, mime] of types) {
      expect(validateFile(mockFile(name, 1024, mime), "File")).toBeNull();
    }
  });
});

describe("generateR2Key", () => {
  it("starts with userId prefix", () => {
    const key = generateR2Key("user-123", "photo.png");
    expect(key.startsWith("user-123/")).toBe(true);
  });

  it("preserves the file extension", () => {
    const key = generateR2Key("user-1", "document.pdf");
    expect(key.endsWith(".pdf")).toBe(true);
  });

  it("sanitizes special characters in filename", () => {
    const key = generateR2Key("user-1", "my file (copy).png");
    expect(key).not.toContain(" ");
    expect(key).not.toContain("(");
  });

  it("truncates long filenames to 50 chars", () => {
    const longName = "a".repeat(100) + ".txt";
    const key = generateR2Key("user-1", longName);
    // Key format: userId/timestamp-random-name.ext
    const namepart = key.split("/")[1].split(".")[0];
    const sanitizedName = namepart.split("-").slice(2).join("-");
    expect(sanitizedName.length).toBeLessThanOrEqual(50);
  });

  it("generates unique keys for same file", () => {
    const key1 = generateR2Key("user-1", "file.txt");
    const key2 = generateR2Key("user-1", "file.txt");
    expect(key1).not.toEqual(key2);
  });

  it("handles files without extension", () => {
    const key = generateR2Key("user-1", "Makefile");
    expect(key.startsWith("user-1/")).toBe(true);
  });
});