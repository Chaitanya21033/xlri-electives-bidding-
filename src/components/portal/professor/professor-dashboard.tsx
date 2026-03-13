import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lock,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface ProfessorDashboardProps {
  user: SessionUser;
  professorProfile: {
    employeeId: string;
    department: string;
    designation: string | null;
  };
  offerings: Array<{
    id: string;
    courseCode: string;
    courseTitle: string;
    credits: number;
    status: string;
    eligibility: string;
    seatCap: number;
    mrbPoints: number;
    isPublished: boolean;
    activeBids: number;
    wonAllocations: number;
    tieBreakMethod: string | null;
    tieBreakLocked: boolean;
  }>;
}

const statusMeta: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" | "default" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  PUBLISHED: { label: "Published", variant: "info" },
  BIDDING_OPEN: { label: "Bidding Open", variant: "success" },
  BIDDING_CLOSED: { label: "Closed", variant: "warning" },
  FINALISED: { label: "Finalised", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "error" },
};

const tieBreakLabels: Record<string, string> = {
  CQPI_DESC: "CQPI",
  PREREQ_GRADE_DESC: "Prereq grade",
  COMPOSITE_RANK: "Composite",
  LOTTERY: "Lottery",
  MANUAL_RANKED_LIST: "Ranked list",
};

export function ProfessorDashboard({
  user,
  professorProfile,
  offerings,
}: ProfessorDashboardProps) {
  const totalActiveBids = offerings.reduce((s, o) => s + o.activeBids, 0);
  const publishedCount = offerings.filter((o) => o.isPublished).length;
  const missingTieBreak = offerings.filter(
    (o) => !o.tieBreakMethod && o.status !== "CANCELLED"
  ).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f2744]">{user.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-[#6b7e8f]">
            {professorProfile.department}
          </span>
          {professorProfile.designation && (
            <>
              <span className="text-[#d4dde6]">·</span>
              <span className="text-sm text-[#6b7e8f]">
                {professorProfile.designation}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          title="My Courses"
          value={offerings.length}
          subtitle="This term"
          icon={BookOpen}
        />
        <StatCard
          title="Active Bidders"
          value={totalActiveBids}
          subtitle="Across all courses"
          icon={Users}
        />
        <StatCard
          title="Published"
          value={publishedCount}
          subtitle="Visible to students"
          icon={TrendingUp}
          variant={publishedCount === offerings.length ? "success" : "warning"}
        />
      </div>

      {/* Alert: missing tie-break */}
      {missingTieBreak > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-[#b91c1c] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#b91c1c]">
              {missingTieBreak} course{missingTieBreak > 1 ? "s" : ""} missing tie-break policy
            </p>
            <p className="text-sm text-[#b91c1c]/80 mt-0.5">
              A tie-break policy must be defined and locked before a bidding
              round can be opened for your course. Set it now in My Courses.
            </p>
          </div>
        </div>
      )}

      {/* Courses table */}
      <div className="rounded-xl border border-[#d4dde6] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4dde6]">
          <h2 className="text-sm font-semibold text-[#1c2b3a]">My courses</h2>
          <Link href="/professor/courses">
            <Button variant="outline" size="sm">
              Manage courses
            </Button>
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d4dde6] bg-[#f5f7fa]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider hidden md:table-cell">
                Seats
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Bidders
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider hidden sm:table-cell">
                Tie-break
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f7fa]">
            {offerings.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[#9aabba]"
                >
                  No courses assigned to you yet
                </td>
              </tr>
            ) : (
              offerings.map((o) => {
                const sm = statusMeta[o.status] ?? {
                  label: o.status,
                  variant: "neutral" as const,
                };
                const isOversubscribed = o.activeBids > o.seatCap;

                return (
                  <tr key={o.id} className="hover:bg-[#f5f7fa]/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1c2b3a]">
                        {o.courseTitle}
                      </p>
                      <p className="text-xs text-[#9aabba]">
                        {o.courseCode} · {o.credits} cr
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#4a5e72]">
                      {o.seatCap}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isOversubscribed
                            ? "text-[#b91c1c]"
                            : "text-[#1a7f5a]"
                        )}
                      >
                        {o.activeBids}
                      </span>
                      {isOversubscribed && (
                        <span className="text-xs text-[#b91c1c] ml-1">
                          (over)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {o.tieBreakMethod ? (
                        <div className="flex items-center gap-1.5">
                          {o.tieBreakLocked ? (
                            <Lock className="h-3 w-3 text-[#1a7f5a]" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-[#1a7f5a]" />
                          )}
                          <span className="text-xs text-[#1a7f5a]">
                            {tieBreakLabels[o.tieBreakMethod] ?? o.tieBreakMethod}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-[#b91c1c]" />
                          <span className="text-xs text-[#b91c1c]">
                            Required
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sm.variant}>{sm.label}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
