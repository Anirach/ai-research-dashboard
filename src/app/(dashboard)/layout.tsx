import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar user={session.user} />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
