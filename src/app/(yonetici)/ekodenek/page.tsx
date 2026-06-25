import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import EkOdenek from "@/models/EkOdenek";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import { requirePageSession } from "@/lib/auth/session";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import EkOdenekClient from "@/components/ekodenek/EkOdenekClient";

export default async function EkOdenekPage() {
  const session = await requirePageSession();
  const siteId = session.siteId as string;
  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const [ekOdenekler, borclar, bloklar] = await Promise.all([
    EkOdenek.find({ siteId }).sort({ createdAt: -1 }).lean(),
    EkOdenekBorcu.find({ siteId }).select("ekOdenekId durum").lean(),
    Blok.find({ siteId }).sort({ ad: 1 }).lean(),
  ]);

  const kartlar = ekOdenekler.map((e) => {
    const ds = borclar.filter((b) => String(b.ekOdenekId) === String(e._id));
    return {
      id: String(e._id),
      ad: e.ad,
      kapsam: e.kapsam,
      tutar: e.tutar,
      sonOdemeTarihi: e.sonOdemeTarihi.toISOString(),
      faizOraniYuzde: e.faizOraniYuzde,
      odenen: ds.filter((b) => b.durum === "Odendi").length,
      toplam: ds.length,
    };
  });

  return <EkOdenekClient ekOdenekler={kartlar} bloklar={bloklar.map((b) => ({ id: String(b._id), ad: b.ad }))} />;
}
