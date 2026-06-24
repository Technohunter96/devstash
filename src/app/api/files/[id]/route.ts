// GET /api/files/[id] — download proxy that streams files from R2 to avoid CORS issues

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemById } from "@/lib/db/items";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemById(session.user.id, id);

  if (!item || !item.fileUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Fetch file from R2 on the server side
    const response = await fetch(item.fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "File not available" },
        { status: 502 }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const blob = await response.blob();

    // Stream file back to client with download headers
    return new NextResponse(blob.stream(), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(item.fileName || "download")}"`,
        "Content-Length": String(item.fileSize || blob.size),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}