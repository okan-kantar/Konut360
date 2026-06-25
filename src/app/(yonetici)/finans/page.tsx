import { connectDB } from "@/lib/db/connect";
import Kasa from "@/models/Kasa";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import TanimListesi from "@/models/TanimListesi";
import { requirePageSession } from "@/lib/auth/session";
import FinansClient from "@/components/finans/FinansClient";

interface KasaLean {
  ad: string;
}

export default async function FinansPage() {
  const session = await requirePageSession();
  const siteId = session.siteId as string;
  await connectDB();

  const [kasalar, hareketler, gelirTurleri, giderTurleri, odemeYontemleri] = await Promise.all([
    Kasa.find({ siteId }).sort({ createdAt: 1 }).lean(),
    GelirGiderKaydi.find({ siteId })
      .sort({ tarih: -1, createdAt: -1 })
      .limit(100)
      .populate<{ kasaId: KasaLean }>("kasaId", "ad")
      .lean(),
    TanimListesi.find({ siteId, kategori: "GelirTuru" }).sort({ deger: 1 }).lean(),
    TanimListesi.find({ siteId, kategori: "GiderTuru" }).sort({ deger: 1 }).lean(),
    TanimListesi.find({ siteId, kategori: "OdemeYontemi" }).sort({ deger: 1 }).lean(),
  ]);

  const anaKasaToplami = kasalar.reduce((a, k) => a + k.guncelBakiye, 0);

  return (
    <FinansClient
      kasalar={kasalar.map((k) => ({ id: String(k._id), ad: k.ad, tip: k.tip, guncelBakiye: k.guncelBakiye }))}
      anaKasaToplami={anaKasaToplami}
      hareketler={hareketler.map((h) => ({
        id: String(h._id),
        tarih: h.tarih.toISOString(),
        aciklama: h.aciklama ?? h.kategori,
        kategori: h.kategori,
        kasaAd: h.kasaId?.ad ?? "",
        tip: h.tip,
        tutar: h.tutar,
        kaynak: h.kaynak,
      }))}
      gelirTurleri={gelirTurleri.map((t) => t.deger)}
      giderTurleri={giderTurleri.map((t) => t.deger)}
      odemeYontemleri={odemeYontemleri.map((t) => t.deger)}
    />
  );
}
