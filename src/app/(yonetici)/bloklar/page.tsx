import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import Daire from "@/models/Daire";
import { requirePageSession } from "@/lib/auth/session";
import BloklarClient from "@/components/bloklar/BloklarClient";

export default async function BloklarPage() {
  const session = await requirePageSession();
  await connectDB();

  const [bloklar, daireler] = await Promise.all([
    Blok.find({ siteId: session.siteId }).sort({ ad: 1 }).lean(),
    Daire.find({ siteId: session.siteId }).select("blokId sakinler").lean(),
  ]);

  const kartlar = bloklar.map((b) => {
    const ds = daireler.filter((d) => String(d.blokId) === String(b._id));
    const dolu = ds.filter((d) => d.sakinler.some((s) => s.aktif)).length;
    return {
      id: String(b._id),
      ad: b.ad,
      katSayisi: b.katSayisi ?? null,
      toplamDaire: ds.length,
      dolu,
      // Borçlu daire sayısı AidatKaydi modeli Faz 3'te eklenince hesaplanacak.
      borclu: 0,
    };
  });

  return <BloklarClient bloklar={kartlar} />;
}
