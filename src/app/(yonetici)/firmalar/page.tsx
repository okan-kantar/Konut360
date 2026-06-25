import { connectDB } from "@/lib/db/connect";
import Firma from "@/models/Firma";
import TanimListesi from "@/models/TanimListesi";
import { requirePageSession } from "@/lib/auth/session";
import FirmalarClient from "@/components/firmalar/FirmalarClient";

export default async function FirmalarPage() {
  const session = await requirePageSession();
  const siteId = session.siteId as string;
  await connectDB();

  const [firmalar, giderTurleri] = await Promise.all([
    Firma.find({ siteId }).sort({ ad: 1 }).lean(),
    TanimListesi.find({ siteId, kategori: "GiderTuru" }).sort({ deger: 1 }).lean(),
  ]);

  return (
    <FirmalarClient
      firmalar={firmalar.map((f) => ({
        id: String(f._id),
        ad: f.ad,
        tur: f.tur,
        hizmet: f.hizmet ?? "",
        yetkili: f.yetkili ?? "",
        vergiNoTckn: f.vergiNoTckn ?? "",
        iban: f.iban ?? "",
      }))}
      hizmetSecenekleri={giderTurleri.map((t) => t.deger)}
    />
  );
}
