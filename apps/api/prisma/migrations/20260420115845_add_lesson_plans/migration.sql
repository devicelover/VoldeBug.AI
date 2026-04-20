-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "board" TEXT NOT NULL,
    "chapter" TEXT,
    "chapterNumber" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "learningObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiActivities" JSONB NOT NULL,
    "suggestedToolId" TEXT,
    "resources" JSONB NOT NULL DEFAULT '[]',
    "rubricTemplate" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plans_slug_key" ON "lesson_plans"("slug");
CREATE INDEX "lesson_plans_subject_idx" ON "lesson_plans"("subject");
CREATE INDEX "lesson_plans_gradeLevel_idx" ON "lesson_plans"("gradeLevel");
CREATE INDEX "lesson_plans_board_idx" ON "lesson_plans"("board");
CREATE INDEX "lesson_plans_isPublic_deletedAt_idx" ON "lesson_plans"("isPublic", "deletedAt");
CREATE INDEX "lesson_plans_subject_gradeLevel_board_idx" ON "lesson_plans"("subject", "gradeLevel", "board");

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_suggestedToolId_fkey" FOREIGN KEY ("suggestedToolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
