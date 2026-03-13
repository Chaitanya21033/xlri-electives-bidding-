/**
 * Bidding Engine Unit Tests
 * Tests MRB computation, tie-break logic, allocation, and withdrawal rules.
 */

import { computeMRB, canReduceBid } from "@/lib/bidding/mrb";
import { rankTiedCandidates } from "@/lib/bidding/tiebreak";
import { runAllocation, isEligible, validateWithdrawal } from "@/lib/bidding/allocation-engine";
import type { BidRecord, CourseOfferingSnapshot } from "@/lib/bidding/types";

// ─────────────────────────────────────────────────────────────
// MRB COMPUTATION
// ─────────────────────────────────────────────────────────────

describe("computeMRB", () => {
  it("returns mrb=0 for empty bids", () => {
    const result = computeMRB([], 20);
    expect(result.mrb).toBe(0);
    expect(result.isTied).toBe(false);
  });

  it("returns mrb=0 for undersubscribed course", () => {
    const bids = [
      { studentId: "s1", pointsAllocated: 100 },
      { studentId: "s2", pointsAllocated: 80 },
      { studentId: "s3", pointsAllocated: 50 },
    ];
    const result = computeMRB(bids, 20); // 3 bidders, 20 seats
    expect(result.mrb).toBe(0);
    expect(result.isTied).toBe(false);
  });

  it("correctly finds clearing price for oversubscribed course", () => {
    const bids = [
      { studentId: "s1", pointsAllocated: 200 },
      { studentId: "s2", pointsAllocated: 180 },
      { studentId: "s3", pointsAllocated: 150 },
      { studentId: "s4", pointsAllocated: 100 },
      { studentId: "s5", pointsAllocated: 80 },
    ];
    const result = computeMRB(bids, 3); // Top 3 win
    expect(result.mrb).toBe(150); // 3rd highest bid
    expect(result.isTied).toBe(false);
  });

  it("detects tie when multiple students bid the same clearing price", () => {
    const bids = [
      { studentId: "s1", pointsAllocated: 200 },
      { studentId: "s2", pointsAllocated: 100 },
      { studentId: "s3", pointsAllocated: 100 },
      { studentId: "s4", pointsAllocated: 100 },
      { studentId: "s5", pointsAllocated: 50 },
    ];
    // 3 seats: s1 wins outright, s2/s3/s4 all tied for 2 remaining seats
    const result = computeMRB(bids, 3);
    expect(result.mrb).toBe(100);
    expect(result.isTied).toBe(true);
    expect(result.tieCount).toBe(3);
  });

  it("handles exact seat fill without tie", () => {
    const bids = [
      { studentId: "s1", pointsAllocated: 300 },
      { studentId: "s2", pointsAllocated: 200 },
      { studentId: "s3", pointsAllocated: 100 },
    ];
    const result = computeMRB(bids, 3); // Exactly 3 bidders, 3 seats
    expect(result.mrb).toBe(0); // Undersubscribed (equal)
  });

  it("returns mrb=0 when seats > bidders (undersubscribed edge case)", () => {
    const bids = [{ studentId: "s1", pointsAllocated: 500 }];
    const result = computeMRB(bids, 10);
    expect(result.mrb).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// BID REDUCTION VALIDATION
// ─────────────────────────────────────────────────────────────

describe("canReduceBid", () => {
  it("allows reduction to exactly MRB", () => {
    const result = canReduceBid(200, 100, 100, false);
    expect(result.allowed).toBe(true);
  });

  it("blocks reduction below MRB", () => {
    const result = canReduceBid(200, 50, 100, false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Minimum Required Bid/);
  });

  it("allows reduction to 0 when MRB is 0", () => {
    const result = canReduceBid(100, 0, 0, false);
    expect(result.allowed).toBe(true);
  });

  it("blocks reduction to 0 when enforceMinOneBid=true and MRB=0", () => {
    const result = canReduceBid(100, 0, 0, true);
    expect(result.allowed).toBe(false);
  });

  it("blocks negative points", () => {
    const result = canReduceBid(100, -10, 0, false);
    expect(result.allowed).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// TIE-BREAK ENGINE
// ─────────────────────────────────────────────────────────────

describe("rankTiedCandidates", () => {
  const candidates = [
    { studentId: "s1", pointsAllocated: 100, cqpi: 8.5, batchType: "BM" as const, rollNumber: "BM001" },
    { studentId: "s2", pointsAllocated: 100, cqpi: 9.2, batchType: "BM" as const, rollNumber: "BM002" },
    { studentId: "s3", pointsAllocated: 100, cqpi: 7.8, batchType: "HRM" as const, rollNumber: "HRM001" },
    { studentId: "s4", pointsAllocated: 100, cqpi: 9.2, batchType: "BM" as const, rollNumber: "BM003" },
  ];

  describe("CQPI_DESC", () => {
    it("ranks by CQPI descending", () => {
      const result = rankTiedCandidates(candidates, 2, {
        method: "CQPI_DESC",
        lotteryAllowed: false,
      });
      const ranked = result.rankedCandidates;
      expect(ranked[0].studentId).toBe("s2"); // 9.2 (earliest roll)
      expect(ranked[1].studentId).toBe("s4"); // 9.2 (later roll)
      expect(ranked[2].studentId).toBe("s1"); // 8.5
      expect(ranked[3].studentId).toBe("s3"); // 7.8
      expect(ranked[0].selected).toBe(true);
      expect(ranked[1].selected).toBe(true);
      expect(ranked[2].selected).toBe(false);
    });

    it("selects exactly seatsRemaining candidates", () => {
      const result = rankTiedCandidates(candidates, 1, {
        method: "CQPI_DESC",
        lotteryAllowed: false,
      });
      const selected = result.rankedCandidates.filter((r) => r.selected);
      expect(selected).toHaveLength(1);
      expect(selected[0].studentId).toBe("s2");
    });
  });

  describe("PREREQ_GRADE_DESC", () => {
    const graded = candidates.map((c, i) => ({
      ...c,
      prereqGrade: [85, 92, 78, 88][i],
    }));

    it("ranks by prerequisite grade descending", () => {
      const result = rankTiedCandidates(graded, 2, {
        method: "PREREQ_GRADE_DESC",
        lotteryAllowed: false,
      });
      expect(result.rankedCandidates[0].studentId).toBe("s2"); // 92
      expect(result.rankedCandidates[1].studentId).toBe("s4"); // 88
    });
  });

  describe("LOTTERY", () => {
    it("throws when lottery not allowed", () => {
      expect(() =>
        rankTiedCandidates(candidates, 2, {
          method: "LOTTERY",
          lotteryAllowed: false,
        })
      ).toThrow(/Lottery tie-break is not enabled/);
    });

    it("produces deterministic output with same seed", () => {
      const result1 = rankTiedCandidates(
        candidates,
        2,
        { method: "LOTTERY", lotteryAllowed: true },
        42
      );
      const result2 = rankTiedCandidates(
        candidates,
        2,
        { method: "LOTTERY", lotteryAllowed: true },
        42
      );
      expect(result1.rankedCandidates.map((r) => r.studentId)).toEqual(
        result2.rankedCandidates.map((r) => r.studentId)
      );
    });

    it("produces different output with different seeds", () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const r = rankTiedCandidates(
          candidates,
          2,
          { method: "LOTTERY", lotteryAllowed: true },
          i * 7919 // prime number seeds
        );
        results.push(r.rankedCandidates[0].studentId);
      }
      // Not all identical (very unlikely with different seeds)
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe("MANUAL_RANKED_LIST", () => {
    it("ranks by manual list order", () => {
      const result = rankTiedCandidates(candidates, 2, {
        method: "MANUAL_RANKED_LIST",
        manualRankedList: ["s3", "s1", "s4", "s2"],
        lotteryAllowed: false,
      });
      expect(result.rankedCandidates[0].studentId).toBe("s3");
      expect(result.rankedCandidates[1].studentId).toBe("s1");
      expect(result.rankedCandidates[2].selected).toBe(false);
    });

    it("throws when manual list is empty", () => {
      expect(() =>
        rankTiedCandidates(candidates, 2, {
          method: "MANUAL_RANKED_LIST",
          manualRankedList: [],
          lotteryAllowed: false,
        })
      ).toThrow(/Manual ranked list is empty/);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// ELIGIBILITY CHECK
// ─────────────────────────────────────────────────────────────

describe("isEligible", () => {
  it("BM student eligible for BM_ONLY course", () => {
    expect(isEligible("BM", "BM_ONLY")).toBe(true);
  });
  it("HRM student NOT eligible for BM_ONLY course", () => {
    expect(isEligible("HRM", "BM_ONLY")).toBe(false);
  });
  it("HRM student eligible for HRM_ONLY course", () => {
    expect(isEligible("HRM", "HRM_ONLY")).toBe(true);
  });
  it("BM student NOT eligible for HRM_ONLY course", () => {
    expect(isEligible("BM", "HRM_ONLY")).toBe(false);
  });
  it("both batches eligible for BOTH course", () => {
    expect(isEligible("BM", "BOTH")).toBe(true);
    expect(isEligible("HRM", "BOTH")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// WITHDRAWAL VALIDATION
// ─────────────────────────────────────────────────────────────

describe("validateWithdrawal", () => {
  it("allows withdrawal from a LOST bid", () => {
    const result = validateWithdrawal(100, "LOST", 100, true);
    expect(result.allowed).toBe(true);
  });

  it("blocks withdrawal from WON bid with points > 0", () => {
    const result = validateWithdrawal(100, "WON", 100, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/reduce your bid to zero/i);
  });

  it("allows withdrawal from WON bid with 0 points", () => {
    const result = validateWithdrawal(0, "WON", 0, true);
    expect(result.allowed).toBe(true);
  });

  it("always allows withdrawal post-round (confirmation window)", () => {
    const result = validateWithdrawal(200, "WON", 100, false);
    expect(result.allowed).toBe(true);
  });

  it("allows withdrawal from TENTATIVE bid with 0 points", () => {
    const result = validateWithdrawal(0, "TENTATIVE", 0, true);
    expect(result.allowed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// FULL ALLOCATION RUN
// ─────────────────────────────────────────────────────────────

describe("runAllocation", () => {
  const baseOffering: CourseOfferingSnapshot = {
    id: "offering-1",
    courseId: "course-1",
    totalSeats: 3,
    eligibility: "BOTH",
    tieBreakMethod: "CQPI_DESC",
    lotteryAllowed: false,
    isQuotaRelaxed: false,
  };

  it("allocates top N bidders for clear oversubscription", () => {
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 500, cqpi: 8.0, batchType: "BM" },
      { studentId: "s2", courseOfferingId: "offering-1", pointsAllocated: 400, cqpi: 7.5, batchType: "BM" },
      { studentId: "s3", courseOfferingId: "offering-1", pointsAllocated: 300, cqpi: 7.0, batchType: "HRM" },
      { studentId: "s4", courseOfferingId: "offering-1", pointsAllocated: 200, cqpi: 9.0, batchType: "HRM" },
      { studentId: "s5", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 6.5, batchType: "BM" },
    ];

    const result = runAllocation(bids, baseOffering);
    const winners = result.decisions.filter((d) => d.status === "WON");
    const losers = result.decisions.filter((d) => d.status === "LOST");

    expect(winners).toHaveLength(3);
    expect(losers).toHaveLength(2);
    expect(winners.map((w) => w.studentId)).toContain("s1");
    expect(winners.map((w) => w.studentId)).toContain("s2");
    expect(winners.map((w) => w.studentId)).toContain("s3");
    expect(result.clearingPrice).toBe(300);
    expect(result.tieBreakApplied).toBe(false);
  });

  it("allocates all bidders when undersubscribed", () => {
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 8.0, batchType: "BM" },
      { studentId: "s2", courseOfferingId: "offering-1", pointsAllocated: 80, cqpi: 7.5, batchType: "HRM" },
    ];

    const result = runAllocation(bids, baseOffering);
    const winners = result.decisions.filter((d) => d.status === "WON");

    expect(winners).toHaveLength(2);
    expect(result.clearingPrice).toBe(0);
  });

  it("applies tie-break when multiple students bid same amount at clearing price", () => {
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 9.5, batchType: "BM" },
      { studentId: "s2", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 8.0, batchType: "BM" },
      { studentId: "s3", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 7.2, batchType: "HRM" },
      { studentId: "s4", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 6.5, batchType: "HRM" },
    ];

    const result = runAllocation(bids, { ...baseOffering, totalSeats: 2 });
    const winners = result.decisions.filter((d) => d.status === "WON");
    const losers = result.decisions.filter((d) => d.status === "LOST");

    expect(winners).toHaveLength(2);
    expect(losers).toHaveLength(2);
    expect(result.tieBreakApplied).toBe(true);
    // Top 2 by CQPI should win
    expect(winners.map((w) => w.studentId).sort()).toEqual(["s1", "s2"]);
  });

  it("enforces eligibility and excludes ineligible students", () => {
    const bmOnlyOffering: CourseOfferingSnapshot = {
      ...baseOffering,
      eligibility: "BM_ONLY",
    };
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 500, cqpi: 8.0, batchType: "BM" },
      { studentId: "s2", courseOfferingId: "offering-1", pointsAllocated: 400, cqpi: 7.5, batchType: "HRM" }, // ineligible
      { studentId: "s3", courseOfferingId: "offering-1", pointsAllocated: 300, cqpi: 7.0, batchType: "BM" },
      { studentId: "s4", courseOfferingId: "offering-1", pointsAllocated: 200, cqpi: 9.0, batchType: "HRM" }, // ineligible
    ];

    const result = runAllocation(bids, bmOnlyOffering);
    // Only BM students should be in decisions
    const decidedStudentIds = result.decisions.map((d) => d.studentId);
    expect(decidedStudentIds).toContain("s1");
    expect(decidedStudentIds).toContain("s3");
    expect(decidedStudentIds).not.toContain("s2");
    expect(decidedStudentIds).not.toContain("s4");
  });

  it("throws if tie-break policy is missing", () => {
    const noTieBreakOffering = {
      ...baseOffering,
      tieBreakMethod: undefined as any,
    };
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 100, cqpi: 8.0, batchType: "BM" },
    ];

    expect(() => runAllocation(bids, noTieBreakOffering)).toThrow(
      /no tie-break policy/
    );
  });

  it("handles zero-bid wins when undersubscribed and enforceMinOneBid=false", () => {
    const bids: BidRecord[] = [
      { studentId: "s1", courseOfferingId: "offering-1", pointsAllocated: 0, cqpi: 8.0, batchType: "BM" },
      { studentId: "s2", courseOfferingId: "offering-1", pointsAllocated: 0, cqpi: 7.5, batchType: "BM" },
    ];

    const result = runAllocation(bids, baseOffering, false);
    const winners = result.decisions.filter((d) => d.status === "WON");
    expect(winners).toHaveLength(2);
    expect(result.clearingPrice).toBe(0);
  });
});
