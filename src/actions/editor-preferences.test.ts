import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEditorPreferences, updateEditorPreferences } from "./editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/constants/editor-preferences";

const mockAuth = vi.fn();
const mockGetEditorPreferencesFromDb = vi.fn();
const mockUpdateEditorPreferencesInDb = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db/editor-preferences", () => ({
  getEditorPreferences: (...args: unknown[]) => mockGetEditorPreferencesFromDb(...args),
  updateEditorPreferencesInDb: (...args: unknown[]) => mockUpdateEditorPreferencesInDb(...args),
}));

const VALID_PREFERENCES = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai" as const,
};

describe("getEditorPreferences", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetEditorPreferencesFromDb.mockReset();
  });

  it("returns defaults when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getEditorPreferences();
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(mockGetEditorPreferencesFromDb).not.toHaveBeenCalled();
  });

  it("returns preferences for the current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetEditorPreferencesFromDb.mockResolvedValue(VALID_PREFERENCES);
    const result = await getEditorPreferences();
    expect(result).toEqual(VALID_PREFERENCES);
    expect(mockGetEditorPreferencesFromDb).toHaveBeenCalledWith("user-1");
  });
});

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateEditorPreferencesInDb.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateEditorPreferences(VALID_PREFERENCES);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateEditorPreferencesInDb).not.toHaveBeenCalled();
  });

  it("returns validation error for an invalid font size", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await updateEditorPreferences({ ...VALID_PREFERENCES, fontSize: 999 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toHaveProperty("fontSize");
  });

  it("returns validation error for an invalid theme", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await updateEditorPreferences({ ...VALID_PREFERENCES, theme: "solarized" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toHaveProperty("theme");
  });

  it("returns success with saved preferences on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateEditorPreferencesInDb.mockResolvedValue(VALID_PREFERENCES);
    const result = await updateEditorPreferences(VALID_PREFERENCES);
    expect(result).toEqual({ success: true, data: VALID_PREFERENCES });
  });

  it("passes userId and parsed preferences to updateEditorPreferencesInDb", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });
    mockUpdateEditorPreferencesInDb.mockResolvedValue(VALID_PREFERENCES);
    await updateEditorPreferences(VALID_PREFERENCES);
    expect(mockUpdateEditorPreferencesInDb).toHaveBeenCalledWith("user-42", VALID_PREFERENCES);
  });
});