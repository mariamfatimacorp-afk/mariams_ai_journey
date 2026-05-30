import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar userName={session.user.name} />
        <main className="flex-1 ml-60 p-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
