/**
 * Tie-break engine for ElectiVe.
 *
 * When multiple students bid the same amount at the clearing price and
 * there are fewer remaining seats than tied students, the tie-break policy
 * for the course must be applied.
 *
 * CRITICAL INVARIANT:
 * A course MUST have a tie-break policy defined and locked before the
 * bidding round is opened. If it doesn't, the admin cannot open the round
 * for that course.
 *
 * Supported methods:
 *   CQPI_DESC          — Higher CQPI wins. If CQPI is also tied, secondary
 *                        sort is by roll number ascending (earlier admission).
 *   PREREQ_GRADE_DESC  — Higher grade in a specified prerequisite course wins.
 *   COMPOSITE_RANK     — Weighted combination of multiple metrics.
 *   LOTTERY            — Random permutation. Seed is logged for auditability.
 *   MANUAL_RANKED_LIST — Admin/professor uploads an ordered list of student IDs.
 */

import type { BidRecord, TieBreakMethod } from "./types";

export interface TieBreakCandidate {
  studentId: string;
  pointsAllocated: number;
  cqpi?: number;
  prereqGrade?: number;
  compositeRank?: number;
  manualRank?: number; // position in manual list (lower = higher priority)
  batchType: "BM" | "HRM";
  // Used as final tiebreaker when all else is equal
  rollNumber?: string;
}

export interface TieBreakConfig {
  method: TieBreakMethod;
  prereqCourseCode?: string | null;
  compositeWeights?: Record<string, number> | null;
  manualRankedList?: string[] | null; // ordered array of student IDs
  lotteryAllowed: boolean;
}

export interface TieBreakResult {
  rankedCandidates: Array<{
    studentId: string;
    rank: number;
    tieBreakScore: number;
    selected: boolean;
  }>;
  method: TieBreakMethod;
  seedUsed?: number; // For lottery reproducibility
}

/**
 * Rank tied candidates by the declared tie-break method.
 * Returns candidates in priority order (index 0 = highest priority).
 *
 * @param candidates - Students who are tied at the clearing price
 * @param seatsRemaining - How many seats are available for these tied students
 * @param config - Tie-break policy for this course
 * @param lotteryRngSeed - Optional seed for reproducible lottery (logged to audit)
 */
export function rankTiedCandidates(
  candidates: TieBreakCandidate[],
  seatsRemaining: number,
  config: TieBreakConfig,
  lotteryRngSeed?: number
): TieBreakResult {
  let ranked: TieBreakCandidate[];
  let seedUsed: number | undefined;

  switch (config.method) {
    case "CQPI_DESC":
      ranked = rankByCQPI(candidates);
      break;

    case "PREREQ_GRADE_DESC":
      ranked = rankByPrereqGrade(candidates);
      break;

    case "COMPOSITE_RANK":
      ranked = rankByComposite(candidates, config.compositeWeights || {});
      break;

    case "LOTTERY":
      if (!config.lotteryAllowed) {
        throw new Error(
          "Lottery tie-break is not enabled for this course. A deterministic method must be declared."
        );
      }
      seedUsed = lotteryRngSeed ?? Date.now();
      ranked = rankByLottery(candidates, seedUsed);
      break;

    case "MANUAL_RANKED_LIST":
      if (!config.manualRankedList || config.manualRankedList.length === 0) {
        throw new Error(
          "Manual ranked list is empty. Upload a ranked list before opening the bidding round."
        );
      }
      ranked = rankByManualList(candidates, config.manualRankedList);
      break;

    default:
      throw new Error(`Unknown tie-break method: ${config.method}`);
  }

  const result: TieBreakResult = {
    method: config.method,
    seedUsed,
    rankedCandidates: ranked.map((c, i) => ({
      studentId: c.studentId,
      rank: i + 1,
      tieBreakScore: getTieBreakScore(c, config),
      selected: i < seatsRemaining,
    })),
  };

  return result;
}

// ─────────────────────────────────────────────────────────────
// Ranking implementations
// ─────────────────────────────────────────────────────────────

function rankByCQPI(candidates: TieBreakCandidate[]): TieBreakCandidate[] {
  return [...candidates].sort((a, b) => {
    const cqpiDiff = (b.cqpi ?? 0) - (a.cqpi ?? 0);
    if (cqpiDiff !== 0) return cqpiDiff;
    // Secondary sort: roll number ascending (lexicographic)
    return (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "");
  });
}

function rankByPrereqGrade(
  candidates: TieBreakCandidate[]
): TieBreakCandidate[] {
  return [...candidates].sort((a, b) => {
    const gradeDiff = (b.prereqGrade ?? 0) - (a.prereqGrade ?? 0);
    if (gradeDiff !== 0) return gradeDiff;
    // Secondary: CQPI
    const cqpiDiff = (b.cqpi ?? 0) - (a.cqpi ?? 0);
    if (cqpiDiff !== 0) return cqpiDiff;
    return (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "");
  });
}

function rankByComposite(
  candidates: TieBreakCandidate[],
  weights: Record<string, number>
): TieBreakCandidate[] {
  const scored = candidates.map((c) => {
    let score = 0;
    if (weights.cqpi) score += (c.cqpi ?? 0) * weights.cqpi;
    if (weights.prereqGrade) score += (c.prereqGrade ?? 0) * weights.prereqGrade;
    if (weights.compositeRank) score += (c.compositeRank ?? 0) * weights.compositeRank;
    return { ...c, _score: score };
  });
  return scored
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...c }) => c);
}

function rankByLottery(
  candidates: TieBreakCandidate[],
  seed: number
): TieBreakCandidate[] {
  // Deterministic Fisher-Yates shuffle using a seeded LCG RNG
  const shuffled = [...candidates];
  let rng = seed;
  function nextRng() {
    // LCG: a=1664525, c=1013904223, m=2^32
    rng = ((rng * 1664525 + 1013904223) >>> 0);
    return rng / 0x100000000;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function rankByManualList(
  candidates: TieBreakCandidate[],
  rankedList: string[]
): TieBreakCandidate[] {
  const positionMap = new Map(rankedList.map((id, idx) => [id, idx]));
  return [...candidates].sort((a, b) => {
    const posA = positionMap.get(a.studentId) ?? Number.MAX_SAFE_INTEGER;
    const posB = positionMap.get(b.studentId) ?? Number.MAX_SAFE_INTEGER;
    return posA - posB;
  });
}

function getTieBreakScore(
  candidate: TieBreakCandidate,
  config: TieBreakConfig
): number {
  switch (config.method) {
    case "CQPI_DESC":
      return candidate.cqpi ?? 0;
    case "PREREQ_GRADE_DESC":
      return candidate.prereqGrade ?? 0;
    case "COMPOSITE_RANK":
      return candidate.compositeRank ?? 0;
    case "MANUAL_RANKED_LIST":
      return candidate.manualRank ?? 0;
    default:
      return 0;
  }
}
