"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search,
  BookOpen,
  Users,
  Coins,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CourseForCatalog {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  eligibility: string;
  totalSeats: number;
  schedule: string | null;
  learningGoals: string | null;
  prerequisites: string[];
  termName: string;
  offering: {
    id: string;
    mrbPoints: number;
    seatCap: number;
    professorName: string;
    activeBidCount: number;
  } | null;
  tieBreakMethod: string | null;
  tieBreakLocked: boolean;
}

interface ExistingBid {
  courseOfferingId: string;
  pointsAllocated: number;
  biddingRoundId: string;
}

interface StudentCatalogProps {
  courses: CourseForCatalog[];
  pointSummary: {
    totalPoints: number;
    usedPoints: number;
    availablePoints: number;
    cycleName: string;
  } | null;
  existingBids: Record<string, ExistingBid>;
  activeRoundId: string | null;
  studentBatchType: string;
  studentId: string;
}

const eligibilityLabels: Record<string, string> = {
  BM_ONLY: "BM Only",
  HRM_ONLY: "HRM Only",
  BOTH: "Open",
};

const tieBreakLabels: Record<string, string> = {
  CQPI_DESC: "CQPI ranking",
  PREREQ_GRADE_DESC: "Prerequisite grade",
  COMPOSITE_RANK: "Composite score",
  LOTTERY: "Lottery",
  MANUAL_RANKED_LIST: "Faculty ranked list",
};

export function StudentCatalog({
  courses,
  pointSummary,
  existingBids,
  activeRoundId,
  studentBatchType,
  studentId,
}: StudentCatalogProps) {
  const [search, setSearch] = useState("");
  const [creditFilter, setCreditFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const filtered = courses.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.offering?.professorName.toLowerCase().includes(search.toLowerCase());
    const matchesCredits =
      creditFilter === "ALL" || String(c.credits) === creditFilter;
    return matchesSearch && matchesCredits;
  });

  const availablePoints = pointSummary?.availablePoints ?? 0;
  const usedPoints = pointSummary?.usedPoints ?? 0;
  const totalPoints = pointSummary?.totalPoints ?? 0;

  async function handleBid(courseId: string, offeringId: string) {
    const points = parseInt(bidInputs[courseId] ?? "0");
    if (isNaN(points) || points < 0) {
      setMessages((m) => ({
        ...m,
        [courseId]: { type: "error", text: "Enter a valid point amount." },
      }));
      return;
    }

    if (!activeRoundId) {
      setMessages((m) => ({
        ...m,
        [courseId]: { type: "error", text: "No active bidding round." },
      }));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/bids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            courseOfferingId: offeringId,
            biddingRoundId: activeRoundId,
            pointsAllocated: points,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessages((m) => ({
            ...m,
            [courseId]: { type: "error", text: data.error ?? "Failed to place bid." },
          }));
        } else {
          setMessages((m) => ({
            ...m,
            [courseId]: { type: "success", text: `Bid of ${points} points placed.` },
          }));
          // Refresh page
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch {
        setMessages((m) => ({
          ...m,
          [courseId]: { type: "error", text: "Network error. Please try again." },
        }));
      }
    });
  }

  const uniqueCredits = [...new Set(courses.map((c) => c.credits))].sort((a, b) => a - b);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f2744]">Course Catalog</h1>
        <p className="mt-0.5 text-sm text-[#6b7e8f]">
          Showing {filtered.length} eligible courses for {studentBatchType} batch
        </p>
      </div>

      {/* Point balance bar */}
      {pointSummary && (
        <div className="rounded-xl border border-[#d4dde6] bg-white p-4 mb-5 flex items-center gap-4">
          <Coins className="h-5 w-5 text-[#1e6fcc] shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#6b7e8f]">
                {pointSummary.cycleName} — Bid points
              </span>
              <span className="text-sm font-semibold text-[#1c2b3a]">
                {availablePoints} available
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f5f7fa]">
              <div
                className="h-1.5 rounded-full bg-[#1e6fcc]"
                style={{
                  width: `${Math.min(100, (usedPoints / totalPoints) * 100)}%`,
                }}
              />
            </div>
          </div>
          <span className="text-xs text-[#9aabba] shrink-0">
            {usedPoints} / {totalPoints} used
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aabba]" />
          <input
            type="text"
            placeholder="Search courses, faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-[#d4dde6] bg-white pl-9 pr-3 text-sm text-[#1c2b3a] placeholder:text-[#9aabba] focus:outline-none focus:border-[#1e6fcc] focus:ring-1 focus:ring-[#1e6fcc]"
          />
        </div>
        <select
          value={creditFilter}
          onChange={(e) => setCreditFilter(e.target.value)}
          className="h-9 rounded-md border border-[#d4dde6] bg-white px-3 text-sm text-[#4a5e72] focus:outline-none focus:border-[#1e6fcc]"
        >
          <option value="ALL">All credits</option>
          {uniqueCredits.map((c) => (
            <option key={c} value={String(c)}>
              {c} credits
            </option>
          ))}
        </select>
      </div>

      {/* Course list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#d4dde6] bg-white p-12 text-center">
            <BookOpen className="h-10 w-10 text-[#d4dde6] mx-auto mb-3" />
            <p className="text-sm text-[#9aabba]">No courses match your search</p>
          </div>
        ) : (
          filtered.map((course) => {
            const isExpanded = expandedId === course.id;
            const existingBid = course.offering
              ? existingBids[course.offering.id]
              : null;
            const hasBid = !!existingBid;
            const bidInput = bidInputs[course.id] ?? String(existingBid?.pointsAllocated ?? "");
            const msg = messages[course.id];
            const isOversubscribed =
              course.offering &&
              course.offering.activeBidCount > course.offering.seatCap;

            return (
              <div
                key={course.id}
                className={cn(
                  "rounded-xl border bg-white transition-all",
                  hasBid ? "border-[#1e6fcc]/30" : "border-[#d4dde6]"
                )}
              >
                {/* Course header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : course.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1c2b3a]">
                        {course.title}
                      </p>
                      {hasBid && (
                        <Badge variant="default">
                          Bid: {existingBid?.pointsAllocated} pts
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-[#9aabba]">
                        {course.code}
                      </span>
                      <span className="text-xs text-[#9aabba]">
                        {course.credits} cr
                      </span>
                      {course.offering && (
                        <span className="text-xs text-[#9aabba]">
                          {course.offering.professorName}
                        </span>
                      )}
                      <Badge variant="neutral">
                        {eligibilityLabels[course.eligibility]}
                      </Badge>
                    </div>
                  </div>

                  {/* Right side info */}
                  <div className="flex items-center gap-4 shrink-0">
                    {course.offering && (
                      <>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[#9aabba]">Seats</p>
                          <p className="text-sm font-medium text-[#1c2b3a]">
                            {course.offering.seatCap}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[#9aabba]">Bidders</p>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isOversubscribed
                                ? "text-[#b91c1c]"
                                : "text-[#1a7f5a]"
                            )}
                          >
                            {course.offering.activeBidCount}
                          </p>
                        </div>
                        {course.offering.mrbPoints > 0 && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-[#9aabba]">MRB</p>
                            <p className="text-sm font-semibold text-[#b45309]">
                              {course.offering.mrbPoints}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#9aabba]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#9aabba]" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#f5f7fa] px-4 pb-4 pt-3">
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      {course.description && (
                        <div>
                          <p className="text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider mb-1">
                            Description
                          </p>
                          <p className="text-sm text-[#4a5e72] leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                      )}
                      {course.learningGoals && (
                        <div>
                          <p className="text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider mb-1">
                            Learning Goals
                          </p>
                          <p className="text-sm text-[#4a5e72] leading-relaxed">
                            {course.learningGoals}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 mb-4 text-xs">
                      {course.schedule && (
                        <div className="flex items-center gap-1 text-[#6b7e8f]">
                          <span className="font-medium">Schedule:</span>
                          {course.schedule}
                        </div>
                      )}
                      {course.prerequisites.length > 0 && (
                        <div className="flex items-center gap-1 text-[#6b7e8f]">
                          <span className="font-medium">Prerequisites:</span>
                          {course.prerequisites.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Tie-break info */}
                    {course.tieBreakMethod && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#f5f7fa] px-3 py-2 mb-4">
                        {course.tieBreakLocked ? (
                          <Lock className="h-3.5 w-3.5 text-[#6b7e8f]" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-[#1e6fcc]" />
                        )}
                        <p className="text-xs text-[#4a5e72]">
                          <span className="font-medium">Tie-break policy:</span>{" "}
                          {tieBreakLabels[course.tieBreakMethod] ??
                            course.tieBreakMethod}
                          {course.tieBreakLocked && " (locked)"}
                        </p>
                      </div>
                    )}

                    {/* Bid input */}
                    {activeRoundId && course.offering && (
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-[#1c2b3a] block mb-1.5">
                            Bid points{" "}
                            {course.offering.mrbPoints > 0 && (
                              <span className="text-[#b45309]">
                                (MRB: {course.offering.mrbPoints})
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={availablePoints + (existingBid?.pointsAllocated ?? 0)}
                            value={bidInput}
                            onChange={(e) =>
                              setBidInputs((prev) => ({
                                ...prev,
                                [course.id]: e.target.value,
                              }))
                            }
                            className="h-9 w-full rounded-md border border-[#d4dde6] bg-white px-3 text-sm text-[#1c2b3a] focus:outline-none focus:border-[#1e6fcc] focus:ring-1 focus:ring-[#1e6fcc]"
                            placeholder="0"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleBid(course.id, course.offering!.id)
                          }
                          disabled={pending}
                          loading={pending}
                        >
                          {hasBid ? "Update bid" : "Place bid"}
                        </Button>
                      </div>
                    )}

                    {!activeRoundId && (
                      <div className="flex items-center gap-2 rounded-lg bg-[#fef3c7] px-3 py-2 mt-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" />
                        <p className="text-xs text-[#b45309]">
                          No active bidding round
                        </p>
                      </div>
                    )}

                    {/* Feedback message */}
                    {msg && (
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 mt-2",
                          msg.type === "success"
                            ? "bg-[#e8f5ef] text-[#1a7f5a]"
                            : "bg-[#fef2f2] text-[#b91c1c]"
                        )}
                      >
                        {msg.type === "success" ? (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <p className="text-xs">{msg.text}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
