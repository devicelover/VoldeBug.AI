-- The hardcoded fallback in tools/[id]/page.tsx held data we should have
-- in the DB. Add the columns + sensible defaults so the detail page can
-- be fully DB-backed without a Google-search fallback.

ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "howTo" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "examplePrompts" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "proTips" TEXT[] DEFAULT ARRAY[]::TEXT[];
