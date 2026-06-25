import { requirePageSession } from "@/lib/auth/session";
import { getRaporVerileri } from "@/lib/services/raporlar";
import RaporlarClient from "@/components/raporlar/RaporlarClient";

export default async function RaporlarPage() {
  const session = await requirePageSession();
  const veri = await getRaporVerileri(session.siteId as string);
  return <RaporlarClient veri={veri} />;
}
