"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollectionInDb,
  updateCollectionInDb,
  deleteCollectionInDb,
  toggleCollectionFavoriteInDb,
} from "@/lib/db/collections";
import type { DashboardCollection } from "@/lib/db/collections";

const CreateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().nullable().optional().transform((v) => v?.trim() || null),
});

type CreateCollectionResult =
  | { success: true; data: DashboardCollection }
  | { success: false; error: string | Record<string, string[]> };

export async function createCollection(formData: unknown): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateCollectionSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const collection = await createCollectionInDb(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  });

  return { success: true, data: collection };
}

const UpdateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().nullable().optional().transform((v) => v?.trim() || null),
});

type UpdateCollectionResult =
  | { success: true; data: DashboardCollection }
  | { success: false; error: string | Record<string, string[]> };

export async function updateCollection(
  collectionId: string,
  formData: unknown
): Promise<UpdateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = UpdateCollectionSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const collection = await updateCollectionInDb(session.user.id, collectionId, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  });

  if (!collection) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, data: collection };
}

type DeleteCollectionResult = { success: true } | { success: false; error: string };

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await deleteCollectionInDb(session.user.id, collectionId);
  if (!deleted) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true };
}

type ToggleCollectionFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function toggleCollectionFavorite(
  collectionId: string
): Promise<ToggleCollectionFavoriteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await toggleCollectionFavoriteInDb(session.user.id, collectionId);
  if (!result) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, isFavorite: result.isFavorite };
}