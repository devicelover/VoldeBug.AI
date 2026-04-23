-- CreateEnum
CREATE TYPE "PromptKind" AS ENUM (
  'EXPLORE', 'VERIFY', 'FEEDBACK', 'REFLECT', 'PRACTICE', 'SUMMARIZE'
);

-- CreateTable
CREATE TABLE "prompt_recipes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "board" TEXT NOT NULL,
    "chapter" TEXT,
    "chapterNumber" INTEGER,
    "topic" TEXT,
    "kind" "PromptKind" NOT NULL DEFAULT 'EXPLORE',
    "recommendedToolId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "copyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "prompt_recipes_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "prompt_recipes_slug_key" ON "prompt_recipes"("slug");
CREATE INDEX "prompt_recipes_subject_idx" ON "prompt_recipes"("subject");
CREATE INDEX "prompt_recipes_gradeLevel_idx" ON "prompt_recipes"("gradeLevel");
CREATE INDEX "prompt_recipes_board_idx" ON "prompt_recipes"("board");
CREATE INDEX "prompt_recipes_chapter_idx" ON "prompt_recipes"("chapter");
CREATE INDEX "prompt_recipes_recommendedToolId_idx" ON "prompt_recipes"("recommendedToolId");
CREATE INDEX "prompt_recipes_isPublic_deletedAt_idx" ON "prompt_recipes"("isPublic", "deletedAt");
CREATE INDEX "prompt_recipes_subject_gradeLevel_board_idx" ON "prompt_recipes"("subject", "gradeLevel", "board");

-- Foreign key on the recommended tool
ALTER TABLE "prompt_recipes"
  ADD CONSTRAINT "prompt_recipes_recommendedToolId_fkey"
  FOREIGN KEY ("recommendedToolId") REFERENCES "tools"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
