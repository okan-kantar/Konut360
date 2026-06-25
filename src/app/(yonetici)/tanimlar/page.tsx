import { connectDB } from "@/lib/db/connect";
import TanimListesi, { TANIM_KATEGORILERI } from "@/models/TanimListesi";
import AidatGrubu from "@/models/AidatGrubu";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";
import { requirePageSession } from "@/lib/auth/session";
import TanimlarClient from "@/components/tanimlar/TanimlarClient";

export default async function TanimlarPage() {
  const session = await requirePageSession();
  await connectDB();

  const [tanimlar, gruplar] = await Promise.all([
    TanimListesi.find({ siteId: session.siteId }).sort({ deger: 1 }).lean(),
    AidatGrubu.find({ siteId: session.siteId }).sort({ ad: 1 }).lean(),
  ]);

  const kategoriler = TANIM_KATEGORILERI.map(({ kategori, label }) => ({
    kategori,
    label,
    items: tanimlar
      .filter((t) => t.kategori === kategori)
      .map((t) => ({ id: String(t._id), deger: t.deger })),
  }));

  const aidatGruplari = gruplar.map((g) => ({
    id: String(g._id),
    ad: g.ad,
    guncelTutar: getGuncelTutar(g),
  }));

  return <TanimlarClient kategoriler={kategoriler} aidatGruplari={aidatGruplari} />;
}
