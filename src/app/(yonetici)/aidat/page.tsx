import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import { requirePageSession } from "@/lib/auth/session";
import { getAidatListesi, currentDonem } from "@/lib/services/aidatListesi";
import AidatClient from "@/components/aidat/AidatClient";

export default async function AidatPage({
  searchParams,
}: {
  searchParams: Promise<{ blok?: string }>;
}) {
  const session = await requirePageSession();
  const { blok } = await searchParams;
  const donem = currentDonem();

  await connectDB();
  const bloklar = await Blok.find({ siteId: session.siteId }).sort({ ad: 1 }).lean();
  const { rows, kpi } = await getAidatListesi(session.siteId as string, donem, blok);

  return (
    <AidatClient
      donem={donem}
      bloklar={bloklar.map((b) => ({ id: String(b._id), ad: b.ad }))}
      aktifBlok={blok ?? null}
      rows={rows}
      kpi={kpi}
      canManage={session.permissions.includes("aidat:manage")}
    />
  );
}
