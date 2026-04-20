-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "assignmentId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "promptHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "responseHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "promptLength" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "audit_logs" ADD COLUMN "responseLength" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "audit_logs" ADD COLUMN "flagReasons" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "audit_logs" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual_paste';

-- CreateIndex
CREATE INDEX "audit_logs_assignmentId_idx" ON "audit_logs"("assignmentId");
CREATE INDEX "audit_logs_responseHash_idx" ON "audit_logs"("responseHash");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
