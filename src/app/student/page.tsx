import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentDashboard } from "@/components/portal/student/student-dashboard";

export const metadata = { title: "My Dashboard — Student" };

export default async function StudentPage() {
  const user = await requireAuth(["STUDENT"]);
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      pointAllocations: {
        include: { biddingCycle: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!studentProfile) {
    return (
      <div className="p-6 text-center text-[#6b7e8f]">
        Student profile not set up. Contact your administrator.
      </div>
    );
  }

  // Get active bids with allocation status
  const activeBids = await prisma.bid.findMany({
    where: {
      studentId: studentProfile.id,
      isActive: true,
    },
    include: {
      courseOffering: {
        include: {
          course: true,
          professor: { include: { user: { select: { name: true } } } },
        },
      },
      biddingRound: { select: { status: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const allocations = await prisma.allocationResult.findMany({
    where: { studentId: studentProfile.id },
    include: {
      courseOffering: {
        include: { course: true },
      },
      biddingRound: { select: { name: true } },
    },
    orderBy: { allocatedAt: "desc" },
    take: 10,
  });

  const currentAllocation = studentProfile.pointAllocations[0];

  return (
    <StudentDashboard
      user={user}
      studentProfile={{
        rollNumber: studentProfile.rollNumber,
        batchType: studentProfile.batchType,
        programme: studentProfile.programme,
        cqpi: studentProfile.cqpi,
      }}
      pointSummary={
        currentAllocation
          ? {
              totalPoints: currentAllocation.totalPoints,
              usedPoints: currentAllocation.usedPoints,
              availablePoints:
                currentAllocation.totalPoints - currentAllocation.usedPoints,
              cycleName: currentAllocation.biddingCycle.name,
            }
          : null
      }
      activeBids={activeBids.map((b) => ({
        id: b.id,
        courseTitle: b.courseOffering.course.title,
        courseCode: b.courseOffering.course.code,
        credits: b.courseOffering.course.credits,
        professorName: b.courseOffering.professor.user.name,
        pointsAllocated: b.pointsAllocated,
        roundName: b.biddingRound.name,
        roundStatus: b.biddingRound.status,
        mrbPoints: b.courseOffering.mrbPoints,
      }))}
      recentAllocations={allocations.map((a) => ({
        id: a.id,
        courseTitle: a.courseOffering.course.title,
        courseCode: a.courseOffering.course.code,
        status: a.status,
        pointsUsed: a.pointsUsed,
        tieBreakApplied: a.tieBreakApplied,
      }))}
    />
  );
}
