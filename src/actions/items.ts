"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createItemInDb, updateItemById, deleteItemById } from "@/lib/db/items";
import { deleteFromR2 } from "@/lib/r2";
import type { ItemDetail, CreateItemData } from "@/lib/db/items";

// All item types that can be created — File/Image are Pro-only but enabled during development
const CREATABLE_TYPE_NAMES = ["Snippet", "Prompt", "Command", "Note", "Link", "File", "Image"] as const;

const CreateItemSchema = z.object({
  typeName: z.enum(CREATABLE_TYPE_NAMES),
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
  tags: z
    .array(z.string().trim())
    .transform((arr) => arr.filter(Boolean))
    .default([]),
  // File/Image upload fields — populated after R2 upload completes
  fileUrl: z.string().url().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
});

type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string | Record<string, string[]> };

export async function createItem(formData: unknown): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateItemSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const item = await createItemInDb(session.user.id, {
    typeName: parsed.data.typeName,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    content: parsed.data.content ?? null,
    url: parsed.data.url ?? null,
    language: parsed.data.language ?? null,
    tags: parsed.data.tags,
    fileUrl: parsed.data.fileUrl ?? null,
    fileName: parsed.data.fileName ?? null,
    fileSize: parsed.data.fileSize ?? null,
  });

  return { success: true, data: item };
}

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

  const { deleted, fileUrl } = await deleteItemById(session.user.id, itemId);
  if (!deleted) {
    return { success: false, error: "Item not found" };
  }

  // Clean up the file from R2 if item had one attached
  if (fileUrl) {
    try {
      await deleteFromR2(fileUrl);
    } catch {
      // File cleanup is best-effort — don't fail the delete if R2 is unreachable
    }
  }

  return { success: true };
}