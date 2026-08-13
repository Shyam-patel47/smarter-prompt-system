import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="pm-layout">
      <Sidebar
        userName={session.user?.name}
        userEmail={session.user?.email}
        userImage={session.user?.image}
      />
      <main className="pm-main">
        {children}
      </main>
    </div>
  );
}
