/**
 * ElectiVe Allocation Engine
 *
 * This module runs the allocation pass for a bidding round.
 * It is invoked by the admin when closing a round.
 *
 * Algorithm:
 * 1. For each course offering with an open round:
 *    a. Gather all active bids (pointsAllocated > 0 or enforceMinOneBid = false).
 *    b. Check batch-level quota constraints (BM/HRM quotas).
 *    c. Sort bids descending by points.
 *    d. Fill seats: students above clearing price → WON.
 *    e. If tie at clearing price: invoke tie-break engine.
 *    f. Remaining bidders → LOST.
 *    g. Optionally add LOST bidders to waitlist.
 * 2. Return AllocationRunResult per offering.
 *
 * Reimbursement: Losing bids must be reimbursed.
 * This is handled transactionally in the Prisma service layer.
 *
 * Concurrency: The engine takes a snapshot of bids. The caller
 * is responsible for acquiring row-level locks before snapshotting.
 */

import { computeMRB, BidInput } from "./mrb";
import { rankTiedCandidates, TieBreakCandidate } from "./tiebreak";
import type {
  BidRecord,
  CourseOfferingSnapshot,
  AllocationDecision,
  AllocationRunResult,
} from "./types";

export function runAllocation(
  bids: BidRecord[],
  offering: CourseOfferingSnapshot,
  enforceMinOneBid: boolean = false,
  lotteryRngSeed?: number
): AllocationRunResult {
  // Filter for eligibility (server-side enforcement)
  const eligibleBids = bids.filter((b) =>
    isEligible(b.batchType, offering.eligibility)
  );

  // Validate we have a tie-break policy — this should already be enforced
  // at round-open time, but we double-check here
  if (!offering.tieBreakMethod) {
    throw new Error(
      `Course offering ${offering.id} has no tie-break policy. Cannot allocate.`
    );
  }

  const bidInputs: BidInput[] = eligibleBids.map((b) => ({
    studentId: b.studentId,
    pointsAllocated: b.pointsAllocated,
  }));

  // Determine effective seat count per batch quota
  const effectiveSeats = offering.totalSeats;
  const bmBids = eligibleBids.filter((b) => b.batchType === "BM");
  const hrmBids = eligibleBids.filter((b) => b.batchType === "HRM");

  const decisions: AllocationDecision[] = [];
  let tieBreakApplied = false;
  let tieCount: number | undefined;

  if (offering.bmSeatCap != null || offering.hrmSeatCap != null) {
    // Quota-based allocation
    const bmResult = allocateWithinQuota(
      bmBids,
      offering.bmSeatCap ?? offering.totalSeats,
      offering,
      enforceMinOneBid,
      lotteryRngSeed
    );
    const hrmResult = allocateWithinQuota(
      hrmBids,
      offering.hrmSeatCap ?? offering.totalSeats,
      offering,
      enforceMinOneBid,
      lotteryRngSeed
    );
    decisions.push(...bmResult.decisions, ...hrmResult.decisions);
    tieBreakApplied = bmResult.tieBreakApplied || hrmResult.tieBreakApplied;
  } else {
    // Open allocation across all eligible bids
    const mrbResult = computeMRB(bidInputs, effectiveSeats);
    const clearingPrice = mrbResult.mrb;

    const winnersAboveMRB = eligibleBids.filter(
      (b) => b.pointsAllocated > clearingPrice
    );
    const tiedAtMRB = eligibleBids.filter(
      (b) => b.pointsAllocated === clearingPrice
    );
    const losersBelowMRB = eligibleBids.filter(
      (b) => b.pointsAllocated < clearingPrice
    );

    // Add above-MRB winners
    for (const bid of winnersAboveMRB) {
      decisions.push({
        studentId: bid.studentId,
        courseOfferingId: offering.id,
        status: "WON",
        pointsUsed: bid.pointsAllocated,
        tieBreakApplied: false,
        clearingPrice,
      });
    }

    const seatsAfterAbove = effectiveSeats - winnersAboveMRB.length;

    // Handle tie
    if (mrbResult.isTied && tiedAtMRB.length > 0 && seatsAfterAbove > 0) {
      tieBreakApplied = true;
      tieCount = tiedAtMRB.length;

      const candidates: TieBreakCandidate[] = tiedAtMRB.map((b) => ({
        studentId: b.studentId,
        pointsAllocated: b.pointsAllocated,
        cqpi: b.cqpi,
        prereqGrade: b.prereqGrade,
        compositeRank: b.compositeRank,
        manualRank: b.manualRank,
        batchType: b.batchType,
      }));

      const tieResult = rankTiedCandidates(
        candidates,
        seatsAfterAbove,
        {
          method: offering.tieBreakMethod,
          prereqCourseCode: offering.prereqCourseCode,
          compositeWeights: offering.compositeWeights,
          manualRankedList: offering.manualRankedList,
          lotteryAllowed: offering.lotteryAllowed,
        },
        lotteryRngSeed
      );

      for (const ranked of tieResult.rankedCandidates) {
        decisions.push({
          studentId: ranked.studentId,
          courseOfferingId: offering.id,
          status: ranked.selected ? "WON" : "LOST",
          pointsUsed: ranked.selected ? clearingPrice : 0,
          tieBreakApplied: true,
          tieBreakRank: ranked.rank,
          clearingPrice,
        });
      }
    } else {
      // No tie or all tied fit in seats
      for (const bid of tiedAtMRB) {
        const hasRoom =
          decisions.filter((d) => d.status === "WON").length < effectiveSeats;
        decisions.push({
          studentId: bid.studentId,
          courseOfferingId: offering.id,
          status: hasRoom ? "WON" : "LOST",
          pointsUsed: hasRoom ? bid.pointsAllocated : 0,
          tieBreakApplied: false,
          clearingPrice,
        });
      }
    }

    // All below-MRB → LOST
    for (const bid of losersBelowMRB) {
      decisions.push({
        studentId: bid.studentId,
        courseOfferingId: offering.id,
        status: "LOST",
        pointsUsed: 0,
        tieBreakApplied: false,
        clearingPrice,
      });
    }

    return {
      decisions,
      clearingPrice,
      totalBidders: eligibleBids.length,
      seatsAvailable: effectiveSeats,
      tieBreakApplied,
      tieCount,
    };
  }

  const clearingPrice = decisions[0]?.clearingPrice ?? 0;
  return {
    decisions,
    clearingPrice,
    totalBidders: eligibleBids.length,
    seatsAvailable: effectiveSeats,
    tieBreakApplied,
    tieCount,
  };
}

function allocateWithinQuota(
  bids: BidRecord[],
  quota: number,
  offering: CourseOfferingSnapshot,
  enforceMinOneBid: boolean,
  lotteryRngSeed?: number
): { decisions: AllocationDecision[]; tieBreakApplied: boolean } {
  const mrbResult = computeMRB(
    bids.map((b) => ({ studentId: b.studentId, pointsAllocated: b.pointsAllocated })),
    quota
  );
  const clearingPrice = mrbResult.mrb;
  const decisions: AllocationDecision[] = [];
  let tieBreakApplied = false;

  const winnersAbove = bids.filter((b) => b.pointsAllocated > clearingPrice);
  const tiedAt = bids.filter((b) => b.pointsAllocated === clearingPrice);
  const losersBelow = bids.filter((b) => b.pointsAllocated < clearingPrice);

  for (const b of winnersAbove) {
    decisions.push({
      studentId: b.studentId,
      courseOfferingId: offering.id,
      status: "WON",
      pointsUsed: b.pointsAllocated,
      tieBreakApplied: false,
      clearingPrice,
    });
  }

  const seatsLeft = quota - winnersAbove.length;

  if (mrbResult.isTied && tiedAt.length > seatsLeft) {
    tieBreakApplied = true;
    const candidates: TieBreakCandidate[] = tiedAt.map((b) => ({
      studentId: b.studentId,
      pointsAllocated: b.pointsAllocated,
      cqpi: b.cqpi,
      prereqGrade: b.prereqGrade,
      batchType: b.batchType,
    }));
    const tieResult = rankTiedCandidates(
      candidates,
      seatsLeft,
      {
        method: offering.tieBreakMethod,
        prereqCourseCode: offering.prereqCourseCode,
        compositeWeights: offering.compositeWeights,
        manualRankedList: offering.manualRankedList,
        lotteryAllowed: offering.lotteryAllowed,
      },
      lotteryRngSeed
    );
    for (const r of tieResult.rankedCandidates) {
      decisions.push({
        studentId: r.studentId,
        courseOfferingId: offering.id,
        status: r.selected ? "WON" : "LOST",
        pointsUsed: r.selected ? clearingPrice : 0,
        tieBreakApplied: true,
        tieBreakRank: r.rank,
        clearingPrice,
      });
    }
  } else {
    for (const b of tiedAt) {
      const hasRoom = decisions.filter((d) => d.status === "WON").length < quota;
      decisions.push({
        studentId: b.studentId,
        courseOfferingId: offering.id,
        status: hasRoom ? "WON" : "LOST",
        pointsUsed: hasRoom ? b.pointsAllocated : 0,
        tieBreakApplied: false,
        clearingPrice,
      });
    }
  }

  for (const b of losersBelow) {
    decisions.push({
      studentId: b.studentId,
      courseOfferingId: offering.id,
      status: "LOST",
      pointsUsed: 0,
      tieBreakApplied: false,
      clearingPrice,
    });
  }

  return { decisions, tieBreakApplied };
}

// ─────────────────────────────────────────────────────────────
// Eligibility check (server-side enforcement)
// ─────────────────────────────────────────────────────────────

export function isEligible(
  studentBatch: "BM" | "HRM",
  eligibility: "BM_ONLY" | "HRM_ONLY" | "BOTH"
): boolean {
  if (eligibility === "BOTH") return true;
  if (eligibility === "BM_ONLY") return studentBatch === "BM";
  if (eligibility === "HRM_ONLY") return studentBatch === "HRM";
  return false;
}

// ─────────────────────────────────────────────────────────────
// Withdrawal validation
// ─────────────────────────────────────────────────────────────

/**
 * Validate whether a student can withdraw from a course during active bidding.
 *
 * Rules (per spec):
 * - Losing: can always withdraw (points reimbursed)
 * - Winning with 0 points: can withdraw (zero-bid win scenario)
 * - Winning with points > 0: CANNOT withdraw during active round
 * - Exception: if MRB is 0, student can reduce to 0 then withdraw
 */
export function validateWithdrawal(
  currentPoints: number,
  currentStatus: "WON" | "LOST" | "TENTATIVE",
  mrb: number,
  isActiveRound: boolean
): { allowed: boolean; reason?: string } {
  if (!isActiveRound) {
    // Post-round: can withdraw from anything during confirmation window
    return { allowed: true };
  }

  if (currentStatus === "LOST") {
    return { allowed: true };
  }

  if (currentStatus === "WON" || currentStatus === "TENTATIVE") {
    if (currentPoints === 0) {
      return { allowed: true };
    }
    if (mrb === 0 && currentPoints === 0) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason:
        "You cannot withdraw from a course you are winning while your bid is above zero. Reduce your bid to zero first (only possible if MRB is 0), then withdraw.",
    };
  }

  return { allowed: true };
}
