"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateItemById, deleteItemById } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

const UpdateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional().transform((v) => v?.trim() || null),
  content: z.string().nullable().optional().transform((v) => v || null),
  url: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v?.trim() || null)
    .refine((v) => v === null || z.string().url().safeParse(v).success, {
      message: "Invalid URL",
    }),
  language: z.string().trim().nullable().optional().transform((v) => v?.trim() || null),
  // filter out empty strings instead of rejecting them
  tags: z
    .array(z.string().trim())
    .transform((arr) => arr.filter(Boolean))
    .default([]),
});

type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string | Record<string, string[]> };

export async function updateItem(
  itemId: string,
  formData: unknown
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = UpdateItemSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const item = await updateItemById(session.user.id, itemId, {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    content: parsed.data.content ?? null,
    url: parsed.data.url ?? null,
    language: parsed.data.language ?? null,
    tags: parsed.data.tags,
  });

  if (!item) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: item };
}

type DeleteItemResult = { success: true } | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await deleteItemById(session.user.id, itemId);
  if (!deleted) {
    return { success: false, error: "Item not found" };
  }

  return { success: true };
}