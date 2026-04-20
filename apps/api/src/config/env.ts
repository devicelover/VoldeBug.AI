import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),

  // S3-compatible object storage. We default to MinIO running on the same
  // VPS for self-hosted school deployments; swap the four vars to point at
  // Cloudflare R2 / AWS S3 in production without code changes.
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  // true for MinIO / R2 (path-style), false for AWS S3 (virtual-hosted).
  S3_FORCE_PATH_STYLE: z
    .string()
    .default("true")
    .transform((s) => s.toLowerCase() === "true"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
