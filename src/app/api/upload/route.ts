// POST /api/upload — accepts multipart file upload, validates, and stores in Cloudflare R2

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  validateFile,
  uploadToR2,
  generateR2Key,
  type UploadTypeName,
} from "@/lib/r2";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract file and type from FormData
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const typeName = formData.get("typeName") as string | null;

  if (!file || !typeName) {
    return NextResponse.json(
      { error: "File and typeName are required" },
      { status: 400 }
    );
  }

  if (typeName !== "File" && typeName !== "Image") {
    return NextResponse.json(
      { error: "typeName must be File or Image" },
      { status: 400 }
    );
  }

  // Server-side validation of size, MIME type, and extension
  const validationError = validateFile(file, typeName as UploadTypeName);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateR2Key(session.user.id, file.name);
    const fileUrl = await uploadToR2(buffer, key, file.type);

    // Return file metadata for the client to attach to the item
    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}