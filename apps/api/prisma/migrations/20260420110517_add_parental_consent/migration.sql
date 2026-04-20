-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED', 'EXPIRED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "dateOfBirth" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "parental_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "parentEmail" TEXT,
    "parentName" TEXT,
    "parentRelationship" TEXT,
    "token" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "respondedFromIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parental_consents_userId_key" ON "parental_consents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parental_consents_token_key" ON "parental_consents"("token");

-- CreateIndex
CREATE INDEX "parental_consents_status_idx" ON "parental_consents"("status");

-- CreateIndex
CREATE INDEX "parental_consents_token_idx" ON "parental_consents"("token");

-- AddForeignKey
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
