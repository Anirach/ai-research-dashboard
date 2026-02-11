import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

// Demo user for screenshots
const demoUser = {
  id: "demo",
  name: "Demo User",
  email: "demo@example.com",
  image: null,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user || demoUser;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-auto pb-20 md:pb-0 scrollbar-thin">
        <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
