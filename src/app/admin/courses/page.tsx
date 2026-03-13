import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminCoursesView } from "@/components/portal/admin/admin-courses-view";

export const metadata = { title: "Courses — Admin" };

export default async function AdminCoursesPage() {
  await requireAuth(["ADMIN"]);

  const courses = await prisma.course.findMany({
    include: {
      academicTerm: { select: { name: true } },
      offerings: {
        include: {
          professor: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      tieBreakPolicy: { select: { id: true, method: true, isLocked: true } },
      _count: { select: { offerings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const terms = await prisma.academicTerm.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, isActive: true },
  });

  return <AdminCoursesView courses={courses as any} terms={terms} />;
}
