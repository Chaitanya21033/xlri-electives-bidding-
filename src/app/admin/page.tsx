import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/portal/admin/admin-dashboard";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const user = await requireAuth(["ADMIN"]);

  // Fetch summary data
  const [
    studentCount,
    professorCount,
    courseCount,
    activeTerm,
    activeCycles,
    activeRounds,
    recentAuditLogs,
    announcements,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "PROFESSOR", isActive: true } }),
    prisma.course.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.academicTerm.findFirst({ where: { isActive: true } }),
    prisma.biddingCycle.count({ where: { academicTerm: { isActive: true } } }),
    prisma.biddingRound.count({ where: { status: "OPEN" } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { performedAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.announcement.count({ where: { isActive: true } }),
  ]);

  const stats = {
    studentCount,
    professorCount,
    courseCount,
    activeCycles,
    activeRounds,
    announcements,
  };

  return (
    <AdminDashboard
      user={user}
      stats={stats}
      activeTerm={activeTerm ? { id: activeTerm.id, name: activeTerm.name } : null}
      recentAuditLogs={recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        performedBy: log.user.name,
        performedAt: log.performedAt.toISOString(),
      }))}
    />
  );
}
