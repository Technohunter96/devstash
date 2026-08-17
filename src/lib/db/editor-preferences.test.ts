import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEditorPreferences, updateEditorPreferencesInDb } from "./editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/constants/editor-preferences";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

describe("getEditorPreferences", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("returns defaults when user has no stored preferences", async () => {
    mockFindUnique.mockResolvedValue({ editorPreferences: null });
    const result = await getEditorPreferences("user-1");
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults when user is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getEditorPreferences("user-1");
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns stored preferences when valid", async () => {
    const stored = { fontSize: 16, tabSize: 4, wordWrap: false, minimap: true, theme: "monokai" };
    mockFindUnique.mockResolvedValue({ editorPreferences: stored });
    const result = await getEditorPreferences("user-1");
    expect(result).toEqual(stored);
  });

  it("falls back to defaults for missing/invalid fields in stored JSON", async () => {
    mockFindUnique.mockResolvedValue({ editorPreferences: { fontSize: 18, theme: "not-a-theme" } });
    const result = await getEditorPreferences("user-1");
    expect(result).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, fontSize: 18 });
  });
});

describe("updateEditorPreferencesInDb", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it("persists preferences and returns the normalized result", async () => {
    const preferences = { fontSize: 14, tabSize: 4, wordWrap: true, minimap: false, theme: "github-dark" as const };
    mockUpdate.mockResolvedValue({ editorPreferences: preferences });

    const result = await updateEditorPreferencesInDb("user-1", preferences);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: preferences },
      select: { editorPreferences: true },
    });
    expect(result).toEqual(preferences);
  });
});