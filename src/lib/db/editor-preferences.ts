import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/constants/editor-preferences";

// Merges stored JSON with defaults so a partial/legacy/corrupt value never breaks the editor
function normalizeEditorPreferences(value: unknown): EditorPreferences {
  if (!value || typeof value !== "object") return DEFAULT_EDITOR_PREFERENCES;

  const v = value as Record<string, unknown>;
  return {
    fontSize: typeof v.fontSize === "number" ? v.fontSize : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize: typeof v.tabSize === "number" ? v.tabSize : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap: typeof v.wordWrap === "boolean" ? v.wordWrap : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap: typeof v.minimap === "boolean" ? v.minimap : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme:
      v.theme === "vs-dark" || v.theme === "monokai" || v.theme === "github-dark"
        ? v.theme
        : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(user?.editorPreferences);
}

export async function updateEditorPreferencesInDb(
  userId: string,
  preferences: EditorPreferences
): Promise<EditorPreferences> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences as unknown as Prisma.InputJsonValue },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(user.editorPreferences);
}