/**
 * Core types for the ElectiVe bidding engine.
 * All business logic operates on these types.
 */

export interface BidRecord {
  studentId: string;
  courseOfferingId: string;
  pointsAllocated: number;
  // Tiebreak inputs
  cqpi?: number;
  prereqGrade?: number;
  compositeRank?: number;
  manualRank?: number;
  // Metadata
  batchType: "BM" | "HRM";
}

export interface CourseOfferingSnapshot {
  id: string;
  courseId: string;
  totalSeats: number;
  bmSeatCap?: number | null;
  hrmSeatCap?: number | null;
  eligibility: "BM_ONLY" | "HRM_ONLY" | "BOTH";
  tieBreakMethod: TieBreakMethod;
  prereqCourseCode?: string | null;
  compositeWeights?: Record<string, number> | null;
  manualRankedList?: string[] | null;
  lotteryAllowed: boolean;
  isQuotaRelaxed: boolean;
  bmQuota?: number | null;
  hrmQuota?: number | null;
}

export type TieBreakMethod =
  | "CQPI_DESC"
  | "PREREQ_GRADE_DESC"
  | "COMPOSITE_RANK"
  | "LOTTERY"
  | "MANUAL_RANKED_LIST";

export interface AllocationDecision {
  studentId: string;
  courseOfferingId: string;
  status: "WON" | "LOST" | "WAITLISTED";
  pointsUsed: number;
  tieBreakApplied: boolean;
  tieBreakRank?: number;
  clearingPrice: number; // MRB at time of allocation
}

export interface AllocationRunResult {
  decisions: AllocationDecision[];
  clearingPrice: number; // final MRB
  totalBidders: number;
  seatsAvailable: number;
  tieBreakApplied: boolean;
  tieCount?: number;
}

export interface MRBComputationResult {
  mrb: number;
  seatsAtMRB: number;
  biddersAtOrAboveMRB: number;
  isTied: boolean;
  tieCount: number;
}

export interface PointUpdate {
  studentId: string;
  courseOfferingId: string;
  newPoints: number;
  currentMrb: number;
  currentStatus: "WON" | "LOST" | "TENTATIVE";
  enforceMinOneBid: boolean;
}

export interface WithdrawalRequest {
  studentId: string;
  courseOfferingId: string;
  biddingRoundId: string;
  currentPoints: number;
  currentMrb: number;
  currentStatus: "WON" | "LOST" | "TENTATIVE";
  isActiveRound: boolean;
}

export type WithdrawalResult =
  | { allowed: true }
  | { allowed: false; reason: string };
