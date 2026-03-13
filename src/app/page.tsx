import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { HomePage } from "@/components/marketing/home-page";

export default function RootPage() {
  return (
    <>
      <PublicNav />
      <main>
        <HomePage />
      </main>
      <PublicFooter />
    </>
  );
}
