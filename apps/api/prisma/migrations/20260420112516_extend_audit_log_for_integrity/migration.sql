-- audit_logs was defined in schema.prisma (commit 60d0d87) but no
-- migration was ever generated for it; the table only ever existed in
-- environments that ran `prisma db push`. Make this migration safe for
-- both: create the base table if missing, then add the integrity columns.

-- ── Base table (matches the original AuditLog model) ────────────────────
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "toolUsed" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Original indexes (idempotent)
CREATE INDEX IF NOT EXISTS "audit_logs_studentId_idx" ON "audit_logs"("studentId");
CREATE INDEX IF NOT EXISTS "audit_logs_isFlagged_idx" ON "audit_logs"("isFlagged");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_studentId_timestamp_idx" ON "audit_logs"("studentId", "timestamp");

-- Foreign key on studentId (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_studentId_fkey'
  ) THEN
    ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- ── New integrity columns ──────────────────────────────────────────────
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "assignmentId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "promptHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "responseHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "promptLength" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "responseLength" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "flagReasons" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual_paste';

-- ── New indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "audit_logs_assignmentId_idx" ON "audit_logs"("assignmentId");
CREATE INDEX IF NOT EXISTS "audit_logs_responseHash_idx" ON "audit_logs"("responseHash");

-- ── New foreign key (idempotent) ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_assignmentId_fkey'
  ) THEN
    ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_assignmentId_fkey"
      FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
