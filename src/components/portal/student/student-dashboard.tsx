import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BookOpen,
  Award,
  Coins,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface StudentDashboardProps {
  user: SessionUser;
  studentProfile: {
    rollNumber: string;
    batchType: string;
    programme: string;
    cqpi: number | null;
  };
  pointSummary: {
    totalPoints: number;
    usedPoints: number;
    availablePoints: number;
    cycleName: string;
  } | null;
  activeBids: Array<{
    id: string;
    courseTitle: string;
    courseCode: string;
    credits: number;
    professorName: string;
    pointsAllocated: number;
    roundName: string;
    roundStatus: string;
    mrbPoints: number;
  }>;
  recentAllocations: Array<{
    id: string;
    courseTitle: string;
    courseCode: string;
    status: string;
    pointsUsed: number;
    tieBreakApplied: boolean;
  }>;
}

const allocationColors: Record<
  string,
  "success" | "warning" | "error" | "info" | "neutral" | "default"
> = {
  WON: "success",
  CONFIRMED: "success",
  LOST: "error",
  TENTATIVE: "warning",
  WITHDRAWN: "neutral",
  WAITLISTED: "info",
};

export function StudentDashboard({
  user,
  studentProfile,
  pointSummary,
  activeBids,
  recentAllocations,
}: StudentDashboardProps) {
  const pct = pointSummary
    ? Math.round((pointSummary.usedPoints / pointSummary.totalPoints) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2744] text-white font-semibold text-sm">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f2744]">{user.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#6b7e8f]">
                {studentProfile.rollNumber}
              </span>
              <span className="text-[#d4dde6]">·</span>
              <Badge variant="neutral">{studentProfile.batchType}</Badge>
              <span className="text-[#d4dde6]">·</span>
              <span className="text-xs text-[#6b7e8f]">
                {studentProfile.programme}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Point balance */}
      {pointSummary ? (
        <div className="rounded-xl border border-[#d4dde6] bg-[#0f2744] p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Bid Points — {pointSummary.cycleName}
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                {pointSummary.availablePoints}
                <span className="text-base font-normal text-white/50 ml-1">
                  / {pointSummary.totalPoints} available
                </span>
              </p>
            </div>
            <Coins className="h-8 w-8 text-white/30" />
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[#1e6fcc] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50">
            {pointSummary.usedPoints} points allocated ({pct}%)
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#b91c1c] shrink-0" />
          <p className="text-sm text-[#b91c1c]">
            No active bidding cycle. Contact your administrator.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Link
          href="/student/catalog"
          className="flex items-center gap-3 rounded-xl border border-[#d4dde6] bg-white p-4 hover:border-[#1e6fcc]/30 hover:shadow-sm transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fb] shrink-0">
            <BookOpen className="h-4 w-4 text-[#1e6fcc]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1c2b3a]">Browse Courses</p>
            <p className="text-xs text-[#9aabba]">Eligible catalog</p>
          </div>
        </Link>
        <Link
          href="/student/bids"
          className="flex items-center gap-3 rounded-xl border border-[#d4dde6] bg-white p-4 hover:border-[#1e6fcc]/30 hover:shadow-sm transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fb] shrink-0">
            <TrendingUp className="h-4 w-4 text-[#1e6fcc]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1c2b3a]">My Bids</p>
            <p className="text-xs text-[#9aabba]">
              {activeBids.length} active
            </p>
          </div>
        </Link>
        <Link
          href="/student/allocations"
          className="flex items-center gap-3 rounded-xl border border-[#d4dde6] bg-white p-4 hover:border-[#1e6fcc]/30 hover:shadow-sm transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fb] shrink-0">
            <Award className="h-4 w-4 text-[#1e6fcc]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1c2b3a]">Results</p>
            <p className="text-xs text-[#9aabba]">Allocations</p>
          </div>
        </Link>
      </div>

      {/* Active bids */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1c2b3a]">
            Active bids
          </h2>
          <Link
            href="/student/bids"
            className="text-xs text-[#1e6fcc] hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {activeBids.length === 0 ? (
          <div className="rounded-xl border border-[#d4dde6] bg-white p-8 text-center">
            <BookOpen className="h-8 w-8 text-[#d4dde6] mx-auto mb-2" />
            <p className="text-sm text-[#9aabba]">No active bids yet</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/student/catalog">Browse courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeBids.slice(0, 5).map((bid) => {
              const isBelowMRB =
                bid.mrbPoints > 0 && bid.pointsAllocated < bid.mrbPoints;
              return (
                <div
                  key={bid.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-white p-4",
                    isBelowMRB ? "border-[#fecaca]" : "border-[#d4dde6]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1c2b3a] truncate">
                      {bid.courseTitle}
                    </p>
                    <p className="text-xs text-[#9aabba]">
                      {bid.courseCode} · {bid.credits} cr · {bid.professorName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#1c2b3a]">
                      {bid.pointsAllocated} pts
                    </p>
                    {bid.mrbPoints > 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          isBelowMRB ? "text-[#b91c1c]" : "text-[#9aabba]"
                        )}
                      >
                        MRB: {bid.mrbPoints}
                      </p>
                    )}
                  </div>
                  {isBelowMRB && (
                    <AlertCircle className="h-4 w-4 text-[#b91c1c] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent allocation results */}
      {recentAllocations.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#1c2b3a] mb-3">
            Allocation results
          </h2>
          <div className="rounded-xl border border-[#d4dde6] bg-white overflow-hidden">
            <ul className="divide-y divide-[#f5f7fa]">
              {recentAllocations.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1c2b3a] truncate">
                      {a.courseTitle}
                    </p>
                    <p className="text-xs text-[#9aabba]">{a.courseCode}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.tieBreakApplied && (
                      <Badge variant="warning">Tie-break</Badge>
                    )}
                    <Badge variant={allocationColors[a.status] ?? "neutral"}>
                      {a.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
