import { requireAuth } from "@/lib/auth";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["PROFESSOR"]);
  return <>{children}</>;
}
