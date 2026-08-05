"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createCollectionInDb } from "@/lib/db/collections";
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