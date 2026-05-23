-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'ANALYSED', 'IN_REVIEW', 'FINALISED');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('segregation_of_duties', 'missing_preventive_control', 'missing_detective_control', 'missing_corrective_control', 'excessive_access', 'documentation_gap', 'manual_process_risk', 'approval_chain_weakness');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ConfidenceLabel" AS ENUM ('high', 'medium', 'low', 'flagged');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'accepted', 'edited', 'dismissed');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('accepted', 'edited', 'dismissed');

-- CreateEnum
CREATE TYPE "ControlTypeSuggested" AS ENUM ('preventive', 'detective', 'corrective', 'multiple');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('session_created', 'document_uploaded', 'ai_request_initiated', 'ai_response_received', 'finding_reviewed', 'session_finalised', 'report_exported', 'auth_event');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('success', 'failure', 'partial');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "processOwner" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalisedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "sanitisedText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "sanitisationApplied" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "affectedProcessStep" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "confidenceLabel" "ConfidenceLabel" NOT NULL,
    "evidenceExcerpt" VARCHAR(200) NOT NULL,
    "recommendation" TEXT NOT NULL,
    "controlTypeSuggested" "ControlTypeSuggested" NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerDecision" (
    "id" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "ReviewAction" NOT NULL,
    "originalRecommendation" TEXT NOT NULL,
    "finalRecommendation" TEXT NOT NULL,
    "reviewerNote" TEXT,
    "findingId" TEXT NOT NULL,

    CONSTRAINT "ReviewerDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "errorDetail" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Document_sessionId_key" ON "Document"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_sessionId_sequence_key" ON "Finding"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerDecision_findingId_key" ON "ReviewerDecision"("findingId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerDecision" ADD CONSTRAINT "ReviewerDecision_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
