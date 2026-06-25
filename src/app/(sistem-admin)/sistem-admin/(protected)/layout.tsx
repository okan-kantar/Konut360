import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import SessionRefresher from "@/components/auth/SessionRefresher";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function SistemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.rol !== "sistem_admin") {
    redirect("/sistem-admin/giris");
  }

  return (
    <div className="min-h-screen bg-bg">
      <SessionRefresher />
      <header className="h-16 bg-navy text-white flex items-center px-8 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.7">
              <rect x="4" y="3" width="9" height="14" rx="1.2" />
              <rect x="13" y="8" width="3.5" height="9" rx="1" />
            </svg>
          </div>
          <span className="font-extrabold tracking-tight">
            Konut<span className="text-accent">360</span>{" "}
            <span className="text-white/60 font-semibold">· Sistem Yönetimi</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/70">{session.adSoyad}</span>
          <LogoutButton loginPath="/sistem-admin/giris" />
        </div>
      </header>
      <main className="p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
