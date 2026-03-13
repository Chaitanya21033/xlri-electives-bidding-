import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfessorDashboard } from "@/components/portal/professor/professor-dashboard";

export const metadata = { title: "Faculty Dashboard" };

export default async function ProfessorPage() {
  const user = await requireAuth(["PROFESSOR"]);

  const professorProfile = await prisma.professorProfile.findUnique({
    where: { userId: user.id },
    include: {
      courseOfferings: {
        include: {
          course: {
            include: {
              tieBreakPolicy: {
                select: { method: true, isLocked: true },
              },
            },
          },
          _count: {
            select: {
              bids: { where: { isActive: true } },
              allocations: { where: { status: "WON" } },
            },
          },
        },
      },
    },
  });

  if (!professorProfile) {
    return (
      <div className="p-6 text-center text-[#6b7e8f]">
        Faculty profile not set up. Contact your administrator.
      </div>
    );
  }

  return (
    <ProfessorDashboard
      user={user}
      professorProfile={{
        employeeId: professorProfile.employeeId,
        department: professorProfile.department,
        designation: professorProfile.designation,
      }}
      offerings={professorProfile.courseOfferings.map((o) => ({
        id: o.id,
        courseCode: o.course.code,
        courseTitle: o.course.title,
        credits: o.course.credits,
        status: o.course.status,
        eligibility: o.course.eligibility,
        seatCap: o.seatCap,
        mrbPoints: o.mrbPoints,
        isPublished: o.isPublished,
        activeBids: o._count.bids,
        wonAllocations: o._count.allocations,
        tieBreakMethod: o.course.tieBreakPolicy?.method ?? null,
        tieBreakLocked: o.course.tieBreakPolicy?.isLocked ?? false,
      }))}
    />
  );
}
