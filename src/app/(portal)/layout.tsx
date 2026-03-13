import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalNav } from "@/components/layout/portal-nav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <PortalNav user={user} />
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
