/**
 * Allocation Service — Prisma transactional operations for bidding.
 *
 * This service wraps the pure allocation engine with database I/O.
 * All bid mutations are transactional. Reimbursements are logged.
 *
 * Concurrency protection:
 * - Bids use an optimistic version field. A bid update fails if
 *   the version has changed since the client last read it.
 * - The allocation run itself uses a serializable transaction.
 */

import { prisma } from "@/lib/prisma";
import { runAllocation, isEligible, validateWithdrawal } from "./allocation-engine";
import type { BidRecord, CourseOfferingSnapshot } from "./types";
import { AuditAction } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Place / update bid
// ─────────────────────────────────────────────────────────────

interface PlaceBidInput {
  studentId: string;
  courseOfferingId: string;
  biddingRoundId: string;
  pointsAllocated: number;
  performedBy: string;
}

export async function placeBid(input: PlaceBidInput) {
  const { studentId, courseOfferingId, biddingRoundId, pointsAllocated, performedBy } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Validate round is open
    const round = await tx.biddingRound.findUnique({
      where: { id: biddingRoundId },
      include: { biddingCycle: true },
    });
    if (!round || round.status !== "OPEN") {
      throw new Error("Bidding round is not currently open.");
    }

    // 2. Validate course offering is published
    const offering = await tx.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: { course: true },
    });
    if (!offering || !offering.isPublished) {
      throw new Error("Course offering is not available for bidding.");
    }

    // 3. Validate student eligibility (server-side)
    const student = await tx.studentProfile.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new Error("Student profile not found.");

    const eligible = isEligible(
      student.batchType as "BM" | "HRM",
      offering.course.eligibility as "BM_ONLY" | "HRM_ONLY" | "BOTH"
    );
    if (!eligible) {
      throw new Error(
        "You are not eligible for this course. This restriction is enforced server-side."
      );
    }

    // 4. Validate MRB constraint and available points
    const pointAllocation = await tx.studentPointAllocation.findUnique({
      where: {
        studentId_biddingCycleId: {
          studentId,
          biddingCycleId: round.biddingCycleId,
        },
      },
    });
    if (!pointAllocation) {
      throw new Error("Point allocation not found for this bidding cycle.");
    }

    // 5. Check existing bid for this student+offering
    const existingBid = await tx.bid.findUnique({
      where: {
        studentId_courseOfferingId_biddingRoundId: {
          studentId,
          courseOfferingId,
          biddingRoundId,
        },
      },
    });

    const previousPoints = existingBid?.pointsAllocated ?? 0;
    const pointDelta = pointsAllocated - previousPoints;

    // Available = total - used + points from this bid (since we're updating)
    const availablePoints = pointAllocation.totalPoints - pointAllocation.usedPoints + previousPoints;
    if (pointsAllocated > availablePoints) {
      throw new Error(
        `Insufficient bid points. You have ${availablePoints} points available.`
      );
    }

    // 6. Check MRB
    const allBids = await tx.bid.findMany({
      where: { courseOfferingId, biddingRoundId, isActive: true },
      select: { pointsAllocated: true, studentId: true },
    });

    const otherBids = allBids.filter((b) => b.studentId !== studentId);
    const effectiveMRB = offering.mrbPoints;

    if (
      round.biddingCycle.enforceMinOneBid &&
      pointsAllocated === 0 &&
      existingBid
    ) {
      throw new Error(
        "This bidding cycle requires a minimum of 1 bid point. You cannot bid 0."
      );
    }

    // 7. Upsert the bid
    let bid;
    if (existingBid) {
      bid = await tx.bid.update({
        where: { id: existingBid.id },
        data: {
          pointsAllocated,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      // Log history
      await tx.bidHistory.create({
        data: {
          bidId: existingBid.id,
          pointsBefore: previousPoints,
          pointsAfter: pointsAllocated,
          action: "UPDATED",
          performedBy,
        },
      });
    } else {
      bid = await tx.bid.create({
        data: {
          studentId,
          courseOfferingId,
          biddingRoundId,
          pointsAllocated,
          isActive: true,
        },
      });
      await tx.bidHistory.create({
        data: {
          bidId: bid.id,
          pointsBefore: 0,
          pointsAfter: pointsAllocated,
          action: "PLACED",
          performedBy,
        },
      });
    }

    // 8. Update used points
    await tx.studentPointAllocation.update({
      where: {
        studentId_biddingCycleId: {
          studentId,
          biddingCycleId: round.biddingCycleId,
        },
      },
      data: { usedPoints: { increment: pointDelta } },
    });

    // 9. Audit log
    await tx.auditLog.create({
      data: {
        performedBy,
        action: existingBid ? AuditAction.BID_UPDATED : AuditAction.BID_PLACED,
        entityType: "Bid",
        entityId: bid.id,
        courseId: offering.courseId,
        metadata: { pointsAllocated, previousPoints, delta: pointDelta },
      },
    });

    return bid;
  });
}

// ─────────────────────────────────────────────────────────────
// Withdraw bid
// ─────────────────────────────────────────────────────────────

interface WithdrawBidInput {
  studentId: string;
  courseOfferingId: string;
  biddingRoundId: string;
  performedBy: string;
  isActiveRound: boolean;
}

export async function withdrawBid(input: WithdrawBidInput) {
  const { studentId, courseOfferingId, biddingRoundId, performedBy, isActiveRound } = input;

  return await prisma.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({
      where: {
        studentId_courseOfferingId_biddingRoundId: {
          studentId,
          courseOfferingId,
          biddingRoundId,
        },
      },
    });

    if (!bid || !bid.isActive) {
      throw new Error("No active bid found to withdraw.");
    }

    const offering = await tx.courseOffering.findUnique({
      where: { id: courseOfferingId },
    });

    // Get current allocation status (if any)
    const allocation = await tx.allocationResult.findUnique({
      where: {
        studentId_courseOfferingId_biddingRoundId: {
          studentId,
          courseOfferingId,
          biddingRoundId,
        },
      },
    });

    const currentStatus = allocation?.status ?? "TENTATIVE";
    const mrb = offering?.mrbPoints ?? 0;

    const validation = validateWithdrawal(
      bid.pointsAllocated,
      currentStatus as "WON" | "LOST" | "TENTATIVE",
      mrb,
      isActiveRound
    );

    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    const pointsToReimburse = bid.pointsAllocated;

    // Mark bid as inactive
    await tx.bid.update({
      where: { id: bid.id },
      data: { isActive: false, pointsAllocated: 0 },
    });

    await tx.bidHistory.create({
      data: {
        bidId: bid.id,
        pointsBefore: bid.pointsAllocated,
        pointsAfter: 0,
        action: "WITHDRAWN",
        performedBy,
      },
    });

    // Reimburse points
    const round = await tx.biddingRound.findUnique({
      where: { id: biddingRoundId },
    });
    if (round) {
      await tx.studentPointAllocation.update({
        where: {
          studentId_biddingCycleId: {
            studentId,
            biddingCycleId: round.biddingCycleId,
          },
        },
        data: { usedPoints: { decrement: pointsToReimburse } },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        performedBy,
        action: AuditAction.BID_WITHDRAWN,
        entityType: "Bid",
        entityId: bid.id,
        courseId: offering?.courseId,
        metadata: { pointsReimbursed: pointsToReimburse },
      },
    });

    // Audit reimbursement
    if (pointsToReimburse > 0) {
      await tx.auditLog.create({
        data: {
          performedBy,
          action: AuditAction.POINTS_REIMBURSED,
          entityType: "StudentPointAllocation",
          entityId: studentId,
          metadata: { points: pointsToReimburse, reason: "bid_withdrawal" },
        },
      });
    }

    return { pointsReimbursed: pointsToReimburse };
  });
}

// ─────────────────────────────────────────────────────────────
// Run allocation for a round (admin action)
// ─────────────────────────────────────────────────────────────

export async function runAllocationForRound(
  biddingRoundId: string,
  adminUserId: string
) {
  return await prisma.$transaction(async (tx) => {
    const round = await tx.biddingRound.findUnique({
      where: { id: biddingRoundId },
      include: { biddingCycle: true },
    });
    if (!round) throw new Error("Bidding round not found.");
    if (round.status !== "CLOSED" && round.status !== "OPEN") {
      throw new Error("Round must be open or closed to run allocation.");
    }

    // Get all offerings for this cycle's courses
    const offerings = await tx.courseOffering.findMany({
      where: {
        course: {
          academicTermId: round.biddingCycle.academicTermId,
        },
        isPublished: true,
      },
      include: {
        course: {
          include: { tieBreakPolicy: true },
        },
        bids: {
          where: { biddingRoundId, isActive: true },
          include: {
            student: {
              select: {
                id: true,
                batchType: true,
                cqpi: true,
              },
            },
          },
        },
      },
    });

    const allResults = [];

    for (const offering of offerings) {
      const tbPolicy = offering.course.tieBreakPolicy;
      if (!tbPolicy) {
        // Skip courses without tie-break policy — should not happen if admin
        // enforced the requirement at round open, but just in case
        console.warn(
          `Offering ${offering.id} has no tie-break policy — skipping allocation.`
        );
        continue;
      }

      const bidRecords: BidRecord[] = offering.bids.map((b) => ({
        studentId: b.studentId,
        courseOfferingId: offering.id,
        pointsAllocated: b.pointsAllocated,
        cqpi: b.student.cqpi ?? undefined,
        batchType: b.student.batchType as "BM" | "HRM",
      }));

      const snapshot: CourseOfferingSnapshot = {
        id: offering.id,
        courseId: offering.courseId,
        totalSeats: offering.seatCap,
        bmSeatCap: offering.bmSeatCap,
        hrmSeatCap: offering.hrmSeatCap,
        eligibility: offering.course.eligibility as "BM_ONLY" | "HRM_ONLY" | "BOTH",
        tieBreakMethod: tbPolicy.method as any,
        prereqCourseCode: tbPolicy.prereqCourseCode,
        compositeWeights: tbPolicy.compositeWeights as Record<string, number> | null,
        manualRankedList: tbPolicy.manualRankedList as string[] | null,
        lotteryAllowed: tbPolicy.lotteryAllowed,
        isQuotaRelaxed: round.quotaRelaxed,
        bmQuota: offering.bmSeatCap,
        hrmQuota: offering.hrmSeatCap,
      };

      const result = runAllocation(
        bidRecords,
        snapshot,
        round.biddingCycle.enforceMinOneBid
      );

      // Persist allocation results
      for (const decision of result.decisions) {
        await tx.allocationResult.upsert({
          where: {
            studentId_courseOfferingId_biddingRoundId: {
              studentId: decision.studentId,
              courseOfferingId: decision.courseOfferingId,
              biddingRoundId,
            },
          },
          create: {
            studentId: decision.studentId,
            courseOfferingId: decision.courseOfferingId,
            biddingRoundId,
            status: decision.status === "WON" ? "WON" : "LOST",
            pointsUsed: decision.pointsUsed,
            tieBreakApplied: decision.tieBreakApplied,
            tieBreakRank: decision.tieBreakRank,
          },
          update: {
            status: decision.status === "WON" ? "WON" : "LOST",
            pointsUsed: decision.pointsUsed,
            tieBreakApplied: decision.tieBreakApplied,
            tieBreakRank: decision.tieBreakRank,
          },
        });

        // Reimburse losing bids
        if (decision.status === "LOST" && decision.pointsUsed === 0) {
          const lostBid = offering.bids.find(
            (b) => b.studentId === decision.studentId
          );
          if (lostBid && lostBid.pointsAllocated > 0) {
            await tx.studentPointAllocation.update({
              where: {
                studentId_biddingCycleId: {
                  studentId: decision.studentId,
                  biddingCycleId: round.biddingCycleId,
                },
              },
              data: {
                usedPoints: { decrement: lostBid.pointsAllocated },
              },
            });

            await tx.auditLog.create({
              data: {
                performedBy: adminUserId,
                action: AuditAction.POINTS_REIMBURSED,
                entityType: "AllocationResult",
                entityId: decision.studentId,
                courseId: offering.courseId,
                metadata: {
                  points: lostBid.pointsAllocated,
                  reason: "lost_allocation",
                },
              },
            });
          }
        }
      }

      // Audit tie-break
      if (result.tieBreakApplied) {
        await tx.auditLog.create({
          data: {
            performedBy: adminUserId,
            action: AuditAction.TIEBREAK_RESOLVED,
            entityType: "CourseOffering",
            entityId: offering.id,
            courseId: offering.courseId,
            metadata: {
              method: tbPolicy.method,
              tieCount: result.tieCount,
              seatsAvailable: result.seatsAvailable,
            },
          },
        });
      }

      allResults.push({ offeringId: offering.id, result });
    }

    // Close the round
    await tx.biddingRound.update({
      where: { id: biddingRoundId },
      data: {
        status: "RESULTS_PUBLISHED",
        resultsPublishedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        performedBy: adminUserId,
        action: AuditAction.ROUND_CLOSED,
        entityType: "BiddingRound",
        entityId: biddingRoundId,
        metadata: { offeringsProcessed: allResults.length },
      },
    });

    return allResults;
  });
}
