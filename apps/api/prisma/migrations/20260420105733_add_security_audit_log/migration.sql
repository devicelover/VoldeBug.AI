-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "targetUserId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_audit_logs_action_idx" ON "security_audit_logs"("action");

-- CreateIndex
CREATE INDEX "security_audit_logs_actorId_idx" ON "security_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "security_audit_logs_targetUserId_idx" ON "security_audit_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "security_audit_logs_createdAt_idx" ON "security_audit_logs"("createdAt");
