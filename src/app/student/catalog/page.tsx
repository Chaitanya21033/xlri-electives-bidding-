import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentCatalog } from "@/components/portal/student/student-catalog";

export const metadata = { title: "Course Catalog — Student" };

export default async function StudentCatalogPage() {
  const user = await requireAuth(["STUDENT"]);

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      pointAllocations: {
        include: { biddingCycle: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      bids: {
        where: { isActive: true },
        select: {
          courseOfferingId: true,
          pointsAllocated: true,
          biddingRoundId: true,
        },
      },
    },
  });

  if (!studentProfile) {
    return (
      <div className="p-6 text-center text-[#6b7e8f]">
        Student profile not found. Contact your administrator.
      </div>
    );
  }

  // Fetch eligible courses based on batch type
  const eligibilityFilter =
    studentProfile.batchType === "BM"
      ? { eligibility: { in: ["BM_ONLY" as const, "BOTH" as const] } }
      : studentProfile.batchType === "HRM"
      ? { eligibility: { in: ["HRM_ONLY" as const, "BOTH" as const] } }
      : {};

  const activeRound = await prisma.biddingRound.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });

  const courses = await prisma.course.findMany({
    where: {
      status: { in: ["PUBLISHED", "BIDDING_OPEN"] },
      ...eligibilityFilter,
    },
    include: {
      academicTerm: { select: { name: true } },
      offerings: {
        include: {
          professor: { include: { user: { select: { name: true } } } },
          _count: {
            select: {
              bids: { where: { isActive: true } },
            },
          },
        },
        take: 1,
      },
      tieBreakPolicy: {
        select: { method: true, isLocked: true },
      },
    },
    orderBy: [{ eligibility: "asc" }, { title: "asc" }],
  });

  const currentAllocation = studentProfile.pointAllocations[0];
  const existingBidMap = new Map(
    studentProfile.bids.map((b) => [b.courseOfferingId, b])
  );

  return (
    <StudentCatalog
      courses={courses.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        credits: c.credits,
        eligibility: c.eligibility,
        totalSeats: c.totalSeats,
        schedule: c.schedule,
        learningGoals: c.learningGoals,
        prerequisites: c.prerequisites,
        termName: c.academicTerm.name,
        offering: c.offerings[0]
          ? {
              id: c.offerings[0].id,
              mrbPoints: c.offerings[0].mrbPoints,
              seatCap: c.offerings[0].seatCap,
              professorName: c.offerings[0].professor.user.name,
              activeBidCount: c.offerings[0]._count.bids,
            }
          : null,
        tieBreakMethod: c.tieBreakPolicy?.method ?? null,
        tieBreakLocked: c.tieBreakPolicy?.isLocked ?? false,
      }))}
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
      existingBids={Object.fromEntries(existingBidMap)}
      activeRoundId={activeRound?.id ?? null}
      studentBatchType={studentProfile.batchType}
      studentId={studentProfile.id}
    />
  );
}
