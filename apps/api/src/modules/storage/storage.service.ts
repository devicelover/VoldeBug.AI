import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";

// ── Allowed file types (CLAUDE.md §3.5) ─────────────────────────────────
// MIME-validated server-side; we never trust the file extension alone.
const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB — CLAUDE.md §3.5

// ── Lazy S3 client ──────────────────────────────────────────────────────
// Constructed only when storage is actually used so the API still boots
// in dev without S3 env vars configured (returns a clear error then).
let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error(
      "Object storage is not configured. Set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET (and S3_ENDPOINT for MinIO).",
    );
  }
  _client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export function isAllowedMimeType(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime.toLowerCase());
}

/**
 * Build a deterministic-but-unguessable object key, namespaced per CLAUDE.md
 * §4.8: `userId/assignmentId/timestamp_random_filename`. The random suffix
 * stops two students collaborating on the same key from colliding.
 */
export function buildObjectKey(opts: {
  userId: string;
  assignmentId?: string;
  fileName: string;
}): string {
  const safeName = opts.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const ts = Date.now();
  const rand = randomBytes(6).toString("hex");
  const segment = opts.assignmentId ? `${opts.assignmentId}/` : "";
  return `uploads/${opts.userId}/${segment}${ts}_${rand}_${safeName}`;
}

/**
 * Issue a short-lived (1 hour, per CLAUDE.md §4.8) presigned PUT URL the
 * client uses to upload directly to the bucket. The Content-Type header is
 * locked to the validated MIME so the client cannot smuggle an arbitrary
 * type past us by lying at upload time.
 */
export async function createPresignedUploadUrl(opts: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<{ uploadUrl: string; publicUrl: string; expiresIn: number }> {
  if (!env.S3_BUCKET) {
    throw new Error("S3_BUCKET is not configured");
  }
  if (!isAllowedMimeType(opts.contentType)) {
    throw new Error(`Unsupported file type: ${opts.contentType}`);
  }
  if (opts.contentLength <= 0 || opts.contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File size must be between 1 byte and ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`,
    );
  }

  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  });

  const expiresIn = 60 * 60; // 1 hour
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn });

  // Public URL for storing in the submission record. For MinIO behind a
  // reverse proxy / R2 with custom domain, S3_PUBLIC_BASE_URL takes
  // precedence; otherwise we fall back to the signed-URL host.
  const base =
    env.S3_PUBLIC_BASE_URL ??
    (env.S3_ENDPOINT
      ? `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}`
      : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`);
  const publicUrl = `${base}/${opts.key}`;

  return { uploadUrl, publicUrl, expiresIn };
}

/**
 * True if the URL points at our own configured bucket. Used to reject
 * submissions that try to attach arbitrary external URLs.
 */
export function isOwnedStorageUrl(url: string): boolean {
  if (!env.S3_BUCKET) return false;
  const bases: string[] = [];
  if (env.S3_PUBLIC_BASE_URL) bases.push(env.S3_PUBLIC_BASE_URL);
  if (env.S3_ENDPOINT) bases.push(`${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}`);
  bases.push(`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`);
  return bases.some((b) => url.startsWith(b.replace(/\/$/, "") + "/"));
}
