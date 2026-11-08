"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateEditorPreferencesInDb } from "@/lib/db/editor-preferences";
import {
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