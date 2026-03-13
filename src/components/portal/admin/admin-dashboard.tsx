import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";

interface AdminDashboardProps {
  user: SessionUser;
  stats: {
    studentCount: number;
    professorCount: number;
    courseCount: number;
    activeCycles: number;
    activeRounds: number;
    announcements: number;
  };
  activeTerm: { id: string; name: string } | null;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    performedBy: string;
    performedAt: string;
  }>;
}

const actionLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "neutral" }> = {
  BID_PLACED: { label: "Bid placed", variant: "default" },
  BID_UPDATED: { label: "Bid updated", variant: "info" },
  BID_WITHDRAWN: { label: "Bid withdrawn", variant: "warning" },
  ALLOCATION_OVERRIDE: { label: "Override", variant: "error" },
  COURSE_CREATED: { label: "Course created", variant: "success" },
  COURSE_UPDATED: { label: "Course updated", variant: "info" },
  ROUND_OPENED: { label: "Round opened", variant: "success" },
  ROUND_CLOSED: { label: "Round closed", variant: "neutral" },
  TIEBREAK_RESOLVED: { label: "Tie-break", variant: "warning" },
  POLICY_CHANGED: { label: "Policy change", variant: "warning" },
  POINTS_REIMBURSED: { label: "Reimbursement", variant: "success" },
  STUDENT_IMPORTED: { label: "Import", variant: "default" },
};

export function AdminDashboard({
  user,
  stats,
  activeTerm,
  recentAuditLogs,
}: AdminDashboardProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2744]">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-[#6b7e8f]">
            {activeTerm
              ? `Active term: ${activeTerm.name}`
              : "No active academic term configured"}
          </p>
        </div>
        <div className="flex gap-2">
          {stats.activeRounds > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#e8f5ef] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1a7f5a] animate-pulse" />
              <span className="text-xs font-medium text-[#1a7f5a]">
                {stats.activeRounds} round{stats.activeRounds > 1 ? "s" : ""} live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Students"
          value={stats.studentCount}
          subtitle="Active accounts"
          icon={GraduationCap}
          variant="default"
        />
        <StatCard
          title="Faculty"
          value={stats.professorCount}
          subtitle="Active professors"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Courses"
          value={stats.courseCount}
          subtitle="Non-cancelled courses"
          icon={BookOpen}
          variant="default"
        />
        <StatCard
          title="Active Rounds"
          value={stats.activeRounds}
          subtitle="Currently open"
          icon={TrendingUp}
          variant={stats.activeRounds > 0 ? "success" : "default"}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {
            href: "/admin/courses",
            label: "Manage Courses",
            desc: "Create, edit, publish",
            icon: BookOpen,
          },
          {
            href: "/admin/cycles",
            label: "Bidding Cycles",
            desc: "Configure rounds and points",
            icon: RefreshCcw,
          },
          {
            href: "/admin/students",
            label: "Students",
            desc: "Import and manage",
            icon: GraduationCap,
          },
          {
            href: "/admin/allocations",
            label: "Allocations",
            desc: "Override and finalize",
            icon: CheckCircle,
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-[#d4dde6] bg-white p-4 hover:border-[#1e6fcc]/30 hover:shadow-sm transition-all"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fb] shrink-0">
              <action.icon className="h-4 w-4 text-[#1e6fcc]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1c2b3a]">{action.label}</p>
              <p className="text-xs text-[#9aabba]">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent audit activity */}
      <div className="rounded-xl border border-[#d4dde6] bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4dde6]">
          <h2 className="text-sm font-semibold text-[#1c2b3a]">
            Recent audit activity
          </h2>
          <Link
            href="/admin/audit"
            className="text-xs text-[#1e6fcc] hover:underline"
          >
            View all
          </Link>
        </div>
        {recentAuditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-[#d4dde6] mb-2" />
            <p className="text-sm text-[#9aabba]">No audit events yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f5f7fa]">
            {recentAuditLogs.map((log) => {
              const meta = actionLabels[log.action] || {
                label: log.action,
                variant: "neutral" as const,
              };
              return (
                <li key={log.id} className="flex items-center gap-4 px-5 py-3">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1c2b3a] truncate">
                      {log.entityType}
                    </p>
                    <p className="text-xs text-[#9aabba]">
                      by {log.performedBy}
                    </p>
                  </div>
                  <span className="text-xs text-[#9aabba] shrink-0">
                    {formatDateTime(log.performedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
