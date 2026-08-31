-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_ONBOARD';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_TOOL_EXPLORED';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_QUIZ_PASS';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_QUEST';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_CURRICULUM_PROMPT';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_PROMPT_BUILT';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_CREATION';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_STARTER_STEP';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_CLASS_JOIN';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_UPSKILL';
ALTER TYPE "XPSource" ADD VALUE 'JOURNEY_BADGE';

-- AlterTable
ALTER TABLE "lesson_plans" ALTER COLUMN "learningObjectives" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prompt_recipes" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tools" ALTER COLUMN "howTo" DROP DEFAULT,
ALTER COLUMN "examplePrompts" DROP DEFAULT,
ALTER COLUMN "proTips" DROP DEFAULT;

-- CreateTable
CREATE TABLE "journey_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journeyRole" TEXT NOT NULL DEFAULT 'student',
    "classGroup" TEXT NOT NULL DEFAULT 'middle',
    "avatar" TEXT NOT NULL DEFAULT 'fox',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "classCode" TEXT NOT NULL DEFAULT '',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "questsDone" INTEGER NOT NULL DEFAULT 0,
    "questDoneOn" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 1,
    "longestStreak" INTEGER NOT NULL DEFAULT 1,
    "lastActiveDate" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),
    "toolsSeen" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chaptersUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promptTemplatesUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starterDone" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teacherModulesDone" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badgeDates" JSONB NOT NULL DEFAULT '{}',
    "toolScores" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_creations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "link" TEXT,
    "note" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '✨',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "journey_creations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "meta" JSONB,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journey_profiles_userId_key" ON "journey_profiles"("userId");

-- CreateIndex
CREATE INDEX "journey_profiles_classCode_xp_idx" ON "journey_profiles"("classCode", "xp" DESC);

-- CreateIndex
CREATE INDEX "journey_profiles_xp_idx" ON "journey_profiles"("xp" DESC);

-- CreateIndex
CREATE INDEX "journey_creations_userId_createdAt_idx" ON "journey_creations"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "journey_events_userId_createdAt_idx" ON "journey_events"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "journey_profiles" ADD CONSTRAINT "journey_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_creations" ADD CONSTRAINT "journey_creations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
