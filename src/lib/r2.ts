// Cloudflare R2 storage client — handles file uploads, deletions, and validation

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// --- Upload size limits ---
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const FILE_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// --- Allowed file extensions per type ---
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);

const FILE_EXTENSIONS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
]);

// --- Allowed MIME types per type ---
const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

// Exported constraints — used by FileUpload component for client-side validation and <input accept>
export const UPLOAD_CONSTRAINTS = {
  Image: {
    maxSize: IMAGE_MAX_SIZE,
    extensions: IMAGE_EXTENSIONS,
    mimeTypes: IMAGE_MIME_TYPES,
    accept: "image/png,image/jpeg,image/gif,image/webp,image/svg+xml",
  },
  File: {
    maxSize: FILE_MAX_SIZE,
    extensions: FILE_EXTENSIONS,
    mimeTypes: FILE_MIME_TYPES,
    accept:
      ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini,application/pdf,text/plain,text/markdown,application/json",
  },
} as const;

// Creates S3-compatible client pointing to Cloudflare R2 endpoint
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME not configured");
  return bucket;
}

// Returns the public-facing URL prefix for constructing file URLs
function getPublicUrl() {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error("R2_PUBLIC_URL not configured");
  return url.replace(/\/$/, "");
}

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export type UploadTypeName = "File" | "Image";

// Validates file size, MIME type, and extension — returns error message or null if valid
export function validateFile(
  file: File,
  typeName: UploadTypeName
): string | null {
  const constraints = UPLOAD_CONSTRAINTS[typeName];

  if (file.size > constraints.maxSize) {
    const maxMB = constraints.maxSize / (1024 * 1024);
    return `File exceeds ${maxMB} MB limit`;
  }

  if (!constraints.mimeTypes.has(file.type)) {
    return `File type "${file.type || "unknown"}" is not allowed`;
  }

  const ext = getExtension(file.name);
  if (!constraints.extensions.has(ext)) {
    return `Extension "${ext || "none"}" is not allowed`;
  }

  return null;
}

// Uploads a file buffer to R2 and returns the public URL
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return `${getPublicUrl()}/${key}`;
}

// Deletes a file from R2 by extracting the key from its public URL
export async function deleteFromR2(fileUrl: string): Promise<void> {
  const publicUrl = getPublicUrl();
  const key = fileUrl.replace(`${publicUrl}/`, "");

  const client = getR2Client();
  const bucket = getBucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

// Generates a unique R2 key: userId/timestamp-random-sanitizedName.ext
export function generateR2Key(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const ext = getExtension(fileName);
  const safeName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 50);
  return `${userId}/${timestamp}-${random}-${safeName}${ext}`;
}