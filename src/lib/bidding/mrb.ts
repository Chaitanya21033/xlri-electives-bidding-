/**
 * MRB (Minimum Required Bid) computation engine.
 *
 * Logic:
 * - Sort all active bids for a course offering descending by points.
 * - Find the Nth highest bid where N = number of available seats.
 * - That bid value is the clearing price (MRB).
 * - If total bidders < seats, MRB = 0 (undersubscribed).
 * - If there's a tie at the Nth position (more students with the same bid
 *   than remaining seats after accounting for higher bids), a tie exists.
 *
 * MRB display: the server computes this on request. The UI shows a
 * "stale" indicator if the last-fetched MRB is more than N seconds old.
 */

import type { MRBComputationResult } from "./types";

export interface BidInput {
  studentId: string;
  pointsAllocated: number;
}

/**
 * Compute the MRB for a course offering given its bids and seat count.
 *
 * @param bids - Active bids for this offering
 * @param seatsAvailable - Total seats available
 * @returns MRBComputationResult
 */
export function computeMRB(
  bids: BidInput[],
  seatsAvailable: number
): MRBComputationResult {
  if (bids.length === 0 || seatsAvailable <= 0) {
    return {
      mrb: 0,
      seatsAtMRB: 0,
      biddersAtOrAboveMRB: 0,
      isTied: false,
      tieCount: 0,
    };
  }

  // Undersubscribed: fewer or equal bidders than seats
  if (bids.length <= seatsAvailable) {
    const minBid = Math.min(...bids.map((b) => b.pointsAllocated));
    return {
      mrb: 0, // clearing price is zero in undersubscription
      seatsAtMRB: seatsAvailable,
      biddersAtOrAboveMRB: bids.length,
      isTied: false,
      tieCount: 0,
    };
  }

  // Sort descending
  const sorted = [...bids].sort((a, b) => b.pointsAllocated - a.pointsAllocated);

  // The Nth bid (index = seatsAvailable - 1) is the clearing price candidate
  const clearingBid = sorted[seatsAvailable - 1];
  const clearingPrice = clearingBid.pointsAllocated;

  // Count how many bids are ABOVE the clearing price
  const bidsAboveClearingPrice = sorted.filter(
    (b) => b.pointsAllocated > clearingPrice
  ).length;

  // Count bids AT the clearing price
  const bidsAtClearingPrice = sorted.filter(
    (b) => b.pointsAllocated === clearingPrice
  ).length;

  // Remaining seats after filling all bids above clearing price
  const remainingSeats = seatsAvailable - bidsAboveClearingPrice;

  // If more students bid exactly clearingPrice than remaining seats, it's a tie
  const isTied = bidsAtClearingPrice > remainingSeats;

  return {
    mrb: clearingPrice,
    seatsAtMRB: remainingSeats,
    biddersAtOrAboveMRB: sorted.filter((b) => b.pointsAllocated >= clearingPrice).length,
    isTied,
    tieCount: isTied ? bidsAtClearingPrice : 0,
  };
}

/**
 * Check if a student can reduce their bid points.
 *
 * Rules:
 * - Can always increase (limited by available points)
 * - Can reduce to the MRB (current clearing price), but not below
 * - Exception: if MRB is 0, can reduce to 0 and then withdraw
 */
export function canReduceBid(
  currentPoints: number,
  newPoints: number,
  mrb: number,
  enforceMinOneBid: boolean
): { allowed: boolean; reason?: string } {
  if (newPoints < 0) {
    return { allowed: false, reason: "Points cannot be negative." };
  }

  const effectiveMRB = enforceMinOneBid && mrb === 0 ? 1 : mrb;

  if (newPoints < effectiveMRB) {
    return {
      allowed: false,
      reason: `Cannot reduce below the current Minimum Required Bid of ${effectiveMRB} points.`,
    };
  }

  return { allowed: true };
}
