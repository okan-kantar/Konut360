import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import SessionRefresher from "@/components/auth/SessionRefresher";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function YoneticiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || (session.rol !== "site_yoneticisi" && session.rol !== "muhasebe")) {
    redirect("/giris");
  }

  return (
    <div className="flex min-h-screen">
      <SessionRefresher />
      <Sidebar adSoyad={session.adSoyad} rol={session.rol} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 px-7.5 py-7 pb-12">{children}</main>
      </div>
    </div>
  );
}
