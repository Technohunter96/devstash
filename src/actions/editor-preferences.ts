"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  getEditorPreferences as getEditorPreferencesFromDb,
  updateEditorPreferencesInDb,
} from "@/lib/db/editor-preferences";
import {
  DEFAULT_EDITOR_PREFERENCES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  type EditorPreferences,
} from "@/lib/constants/editor-preferences";

const EditorPreferencesSchema = z.object({
  fontSize: z.number().refine((v) => (FONT_SIZE_OPTIONS as readonly number[]).includes(v), {
    message: "Invalid font size",
  }),
  tabSize: z.number().refine((v) => (TAB_SIZE_OPTIONS as readonly number[]).includes(v), {
    message: "Invalid tab size",
  }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

export async function getEditorPreferences(): Promise<EditorPreferences> {
  const session = await auth();
  if (!session?.user?.id) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  return getEditorPreferencesFromDb(session.user.id);
}

type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string | Record<string, string[]> };

export async function updateEditorPreferences(
  formData: unknown
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = EditorPreferencesSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const preferences = await updateEditorPreferencesInDb(session.user.id, parsed.data);

  return { success: true, data: preferences };
}