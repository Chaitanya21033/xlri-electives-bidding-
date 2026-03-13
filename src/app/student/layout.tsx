import { requireAuth } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["STUDENT"]);
  return <>{children}</>;
}
