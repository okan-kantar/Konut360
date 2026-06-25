import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import SessionRefresher from "@/components/auth/SessionRefresher";

export default async function SakinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.rol !== "site_sakini" || !session.daireId) {
    redirect("/giris");
  }

  return (
    <>
      <SessionRefresher />
      {children}
    </>
  );
}
