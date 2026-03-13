"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Lock,
  Filter,
} from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  status: string;
  eligibility: string;
  totalSeats: number;
  academicTerm: { name: string };
  offerings: Array<{
    id: string;
    seatCap: number;
    mrbPoints: number;
    isPublished: boolean;
    professor: { user: { name: string } };
  }>;
  tieBreakPolicy: { id: string; method: string; isLocked: boolean } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "neutral" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  PUBLISHED: { label: "Published", variant: "info" },
  BIDDING_OPEN: { label: "Bidding Open", variant: "success" },
  BIDDING_CLOSED: { label: "Bidding Closed", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "error" },
  FINALISED: { label: "Finalised", variant: "success" },
};

const eligibilityConfig: Record<string, string> = {
  BM_ONLY: "BM Only",
  HRM_ONLY: "HRM Only",
  BOTH: "BM + HRM",
};

export function AdminCoursesView({
  courses,
  terms,
}: {
  courses: Course[];
  terms: { id: string; name: string; isActive: boolean }[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = courses.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2744]">Courses</h1>
          <p className="mt-0.5 text-sm text-[#6b7e8f]">
            {courses.length} courses across all terms
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aabba]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-[#d4dde6] bg-white pl-9 pr-3 text-sm text-[#1c2b3a] placeholder:text-[#9aabba] focus:outline-none focus:border-[#1e6fcc] focus:ring-1 focus:ring-[#1e6fcc]"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-[#d4dde6] bg-white p-1">
          {["ALL", "DRAFT", "PUBLISHED", "BIDDING_OPEN", "BIDDING_CLOSED", "FINALISED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#1e6fcc] text-white"
                  : "text-[#6b7e8f] hover:text-[#1c2b3a]"
              )}
            >
              {s === "ALL" ? "All" : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#d4dde6] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d4dde6] bg-[#f5f7fa]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Eligibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Seats
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Faculty
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Tie-break
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7e8f] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f7fa]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-[#9aabba]"
                >
                  No courses found
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const statusMeta = statusConfig[course.status] || {
                  label: course.status,
                  variant: "neutral" as const,
                };
                const hasTieBreak = !!course.tieBreakPolicy;
                const isLocked = course.tieBreakPolicy?.isLocked;

                return (
                  <tr key={course.id} className="hover:bg-[#f5f7fa]/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1c2b3a]">
                          {course.title}
                        </p>
                        <p className="text-xs text-[#9aabba]">
                          {course.code} · {course.credits} cr
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">
                        {eligibilityConfig[course.eligibility]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#4a5e72]">
                      {course.totalSeats}
                    </td>
                    <td className="px-4 py-3">
                      {course.offerings[0] ? (
                        <span className="text-[#4a5e72]">
                          {course.offerings[0].professor.user.name}
                        </span>
                      ) : (
                        <span className="text-[#9aabba]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasTieBreak ? (
                        <div className="flex items-center gap-1.5">
                          {isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-[#1a7f5a]" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-[#1a7f5a]" />
                          )}
                          <span className="text-xs text-[#1a7f5a]">
                            {course.tieBreakPolicy!.method.replace(/_/g, " ")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" />
                          <span className="text-xs text-[#b45309]">
                            Not defined
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMeta.variant}>
                        {statusMeta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
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
