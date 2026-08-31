-- CreateTable
CREATE TABLE "journey_classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classGroup" TEXT NOT NULL DEFAULT 'middle',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "journey_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journey_classes_code_key" ON "journey_classes"("code");

-- CreateIndex
CREATE INDEX "journey_classes_ownerId_idx" ON "journey_classes"("ownerId");

-- AddForeignKey
ALTER TABLE "journey_classes" ADD CONSTRAINT "journey_classes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
