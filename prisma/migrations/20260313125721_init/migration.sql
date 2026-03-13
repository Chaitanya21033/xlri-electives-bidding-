-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROFESSOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "BatchType" AS ENUM ('BM', 'HRM', 'BOTH');

-- CreateEnum
CREATE TYPE "EligibilityType" AS ENUM ('BM_ONLY', 'HRM_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "BiddingRoundStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'RESULTS_PUBLISHED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('TENTATIVE', 'WON', 'LOST', 'WITHDRAWN', 'CONFIRMED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "TieBreakMethod" AS ENUM ('CQPI_DESC', 'PREREQ_GRADE_DESC', 'COMPOSITE_RANK', 'LOTTERY', 'MANUAL_RANKED_LIST');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'BIDDING_OPEN', 'BIDDING_CLOSED', 'CANCELLED', 'FINALISED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('BID_PLACED', 'BID_UPDATED', 'BID_WITHDRAWN', 'ALLOCATION_OVERRIDE', 'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_CANCELLED', 'ROUND_OPENED', 'ROUND_CLOSED', 'STUDENT_IMPORTED', 'PROFESSOR_IMPORTED', 'TIEBREAK_RESOLVED', 'POLICY_CHANGED', 'CONFIRMATION_ACTION', 'POINTS_REIMBURSED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "batchType" "BatchType" NOT NULL,
    "programme" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL DEFAULT 1,
    "cqpi" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTerm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "totalPointsPerStudent" INTEGER NOT NULL DEFAULT 1000,
    "allowCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "enforceMinOneBid" BOOLEAN NOT NULL DEFAULT false,
    "crossProgrammeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPointAllocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "biddingCycleId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "usedPoints" INTEGER NOT NULL DEFAULT 0,
    "carriedForward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPointAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingRound" (
    "id" TEXT NOT NULL,
    "biddingCycleId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BiddingRoundStatus" NOT NULL DEFAULT 'DRAFT',
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "resultsPublishedAt" TIMESTAMP(3),
    "isConfirmationRound" BOOLEAN NOT NULL DEFAULT false,
    "quotaRelaxed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "eligibility" "EligibilityType" NOT NULL DEFAULT 'BOTH',
    "totalSeats" INTEGER NOT NULL,
    "bmQuota" INTEGER,
    "hrmQuota" INTEGER,
    "minEnrollment" INTEGER NOT NULL DEFAULT 5,
    "prerequisites" TEXT[],
    "schedule" TEXT,
    "learningGoals" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "seatCap" INTEGER NOT NULL,
    "bmSeatCap" INTEGER,
    "hrmSeatCap" INTEGER,
    "mrbPoints" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TieBreakPolicy" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "method" "TieBreakMethod" NOT NULL,
    "prereqCourseCode" TEXT,
    "compositeWeights" JSONB,
    "manualRankedList" JSONB,
    "lotteryAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TieBreakPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "biddingRoundId" TEXT NOT NULL,
    "pointsAllocated" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidHistory" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "pointsBefore" INTEGER NOT NULL,
    "pointsAfter" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "biddingRoundId" TEXT NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'TENTATIVE',
    "pointsUsed" INTEGER NOT NULL,
    "tieBreakApplied" BOOLEAN NOT NULL DEFAULT false,
    "tieBreakRank" INTEGER,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfirmationAction" (
    "id" TEXT NOT NULL,
    "allocationResultId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfirmationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditConstraint" (
    "id" TEXT NOT NULL,
    "batchType" "BatchType" NOT NULL,
    "minCredits" INTEGER NOT NULL,
    "maxCredits" INTEGER NOT NULL,
    "termId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetRole" "UserRole",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "courseId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "initiatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaRule" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "biddingRoundId" TEXT NOT NULL,
    "batchType" "BatchType" NOT NULL,
    "quota" INTEGER NOT NULL,
    "isRelaxed" BOOLEAN NOT NULL DEFAULT false,
    "relaxedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotaRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_rollNumber_key" ON "StudentProfile"("rollNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_rollNumber_idx" ON "StudentProfile"("rollNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_batchType_idx" ON "StudentProfile"("batchType");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorProfile_userId_key" ON "ProfessorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorProfile_employeeId_key" ON "ProfessorProfile"("employeeId");

-- CreateIndex
CREATE INDEX "ProfessorProfile_employeeId_idx" ON "ProfessorProfile"("employeeId");

-- CreateIndex
CREATE INDEX "AcademicTerm_isActive_idx" ON "AcademicTerm"("isActive");

-- CreateIndex
CREATE INDEX "BiddingCycle_academicTermId_idx" ON "BiddingCycle"("academicTermId");

-- CreateIndex
CREATE INDEX "StudentPointAllocation_studentId_idx" ON "StudentPointAllocation"("studentId");

-- CreateIndex
CREATE INDEX "StudentPointAllocation_biddingCycleId_idx" ON "StudentPointAllocation"("biddingCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPointAllocation_studentId_biddingCycleId_key" ON "StudentPointAllocation"("studentId", "biddingCycleId");

-- CreateIndex
CREATE INDEX "BiddingRound_status_idx" ON "BiddingRound"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingRound_biddingCycleId_roundNumber_key" ON "BiddingRound"("biddingCycleId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_academicTermId_idx" ON "Course"("academicTermId");

-- CreateIndex
CREATE INDEX "Course_eligibility_idx" ON "Course"("eligibility");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "CourseOffering_courseId_idx" ON "CourseOffering"("courseId");

-- CreateIndex
CREATE INDEX "CourseOffering_professorId_idx" ON "CourseOffering"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_professorId_key" ON "CourseOffering"("courseId", "professorId");

-- CreateIndex
CREATE UNIQUE INDEX "TieBreakPolicy_courseId_key" ON "TieBreakPolicy"("courseId");

-- CreateIndex
CREATE INDEX "Bid_studentId_idx" ON "Bid"("studentId");

-- CreateIndex
CREATE INDEX "Bid_courseOfferingId_idx" ON "Bid"("courseOfferingId");

-- CreateIndex
CREATE INDEX "Bid_biddingRoundId_idx" ON "Bid"("biddingRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_studentId_courseOfferingId_biddingRoundId_key" ON "Bid"("studentId", "courseOfferingId", "biddingRoundId");

-- CreateIndex
CREATE INDEX "BidHistory_bidId_idx" ON "BidHistory"("bidId");

-- CreateIndex
CREATE INDEX "AllocationResult_studentId_idx" ON "AllocationResult"("studentId");

-- CreateIndex
CREATE INDEX "AllocationResult_courseOfferingId_idx" ON "AllocationResult"("courseOfferingId");

-- CreateIndex
CREATE INDEX "AllocationResult_status_idx" ON "AllocationResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AllocationResult_studentId_courseOfferingId_biddingRoundId_key" ON "AllocationResult"("studentId", "courseOfferingId", "biddingRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmationAction_allocationResultId_key" ON "ConfirmationAction"("allocationResultId");

-- CreateIndex
CREATE INDEX "ConfirmationAction_studentId_idx" ON "ConfirmationAction"("studentId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_courseOfferingId_position_idx" ON "WaitlistEntry"("courseOfferingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_studentId_courseOfferingId_key" ON "WaitlistEntry"("studentId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "CreditConstraint_batchType_idx" ON "CreditConstraint"("batchType");

-- CreateIndex
CREATE UNIQUE INDEX "CreditEnrollment_studentId_academicTermId_key" ON "CreditEnrollment"("studentId", "academicTermId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "ImportJob_type_status_idx" ON "ImportJob"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaRule_courseOfferingId_biddingRoundId_batchType_key" ON "QuotaRule"("courseOfferingId", "biddingRoundId", "batchType");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorProfile" ADD CONSTRAINT "ProfessorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingCycle" ADD CONSTRAINT "BiddingCycle_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPointAllocation" ADD CONSTRAINT "StudentPointAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPointAllocation" ADD CONSTRAINT "StudentPointAllocation_biddingCycleId_fkey" FOREIGN KEY ("biddingCycleId") REFERENCES "BiddingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingRound" ADD CONSTRAINT "BiddingRound_biddingCycleId_fkey" FOREIGN KEY ("biddingCycleId") REFERENCES "BiddingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "ProfessorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TieBreakPolicy" ADD CONSTRAINT "TieBreakPolicy_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_biddingRoundId_fkey" FOREIGN KEY ("biddingRoundId") REFERENCES "BiddingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationResult" ADD CONSTRAINT "AllocationResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationResult" ADD CONSTRAINT "AllocationResult_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationResult" ADD CONSTRAINT "AllocationResult_biddingRoundId_fkey" FOREIGN KEY ("biddingRoundId") REFERENCES "BiddingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmationAction" ADD CONSTRAINT "ConfirmationAction_allocationResultId_fkey" FOREIGN KEY ("allocationResultId") REFERENCES "AllocationResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmationAction" ADD CONSTRAINT "ConfirmationAction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEnrollment" ADD CONSTRAINT "CreditEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaRule" ADD CONSTRAINT "QuotaRule_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
