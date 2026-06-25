import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import AidatKaydi from "@/models/AidatKaydi";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import Site from "@/models/Site";
import { getSession } from "@/lib/auth/session";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import { efektifFaiz } from "@/lib/services/efektifFaiz";
import { currentDonem } from "@/lib/services/aidatListesi";
import SakinPortalClient from "@/components/sakin/SakinPortalClient";

const AY_ADI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

interface BlokLean {
  ad: string;
}
interface EkOdenekLean {
  ad: string;
}

export default async function SakinPortalPage() {
  const session = await getSession();
  if (!session || session.rol !== "site_sakini" || !session.daireId) {
    redirect("/giris");
  }

  const siteId = session.siteId as string;
  const daireId = session.daireId;

  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const [daire, aidatKayitlari, ekBorclar, site] = await Promise.all([
    Daire.findOne({ _id: daireId, siteId }).populate<{ blokId: BlokLean }>("blokId", "ad").lean(),
    AidatKaydi.find({ siteId, daireId }).sort({ donem: -1 }).lean(),
    EkOdenekBorcu.find({ siteId, daireId }).populate<{ ekOdenekId: EkOdenekLean }>("ekOdenekId", "ad").lean(),
    Site.findById(siteId).lean(),
  ]);

  if (!daire || !site) {
    redirect("/giris");
  }

  const faizPolitikasi = site.faizPolitikasi;
  const donem = currentDonem();
  const guncelKayit = aidatKayitlari.find((k) => k.donem === donem);
  const guncelFaiz = guncelKayit ? efektifFaiz(guncelKayit, faizPolitikasi) : 0;

  const yil = new Date().getFullYear();
  const yilKayitlari = aidatKayitlari.filter((k) => k.donem.startsWith(String(yil)));
  const odenenler = yilKayitlari.filter((k) => k.durum === "Odendi");
  const bekleyenler = yilKayitlari.filter((k) => k.durum !== "Odendi");
  const toplamOdenen = odenenler.reduce((a, k) => a + k.birimTutar + k.hesaplananFaiz, 0);
  const toplamBekleyen = bekleyenler.reduce((a, k) => a + k.birimTutar + efektifFaiz(k, faizPolitikasi), 0);
  const zamanindaOdeme =
    odenenler.length > 0
      ? Math.round(
          (odenenler.filter((k) => k.odemeTarihi && k.odemeTarihi.getTime() <= k.vadeTarihi.getTime()).length /
            odenenler.length) *
            100,
        )
      : 0;

  const aktifSakin = daire.sakinler.find((s) => s.aktif);

  const gecmis = [
    ...aidatKayitlari.map((k) => {
      const [y, m] = k.donem.split("-");
      return {
        id: String(k._id),
        baslik: `${AY_ADI[Number(m) - 1]} ${y} Aidatı`,
        not: k.durum === "Odendi" && k.odemeTarihi ? `${k.odemeTarihi.toLocaleDateString("tr-TR")} ödendi` : "Cari dönem",
        tutar: k.birimTutar + efektifFaiz(k, faizPolitikasi),
        durum: k.durum,
      };
    }),
    ...ekBorclar.map((b) => ({
      id: String(b._id),
      baslik: b.ekOdenekId?.ad ?? "Ek Ödenek",
      not: `Son ödeme ${b.sonOdemeTarihi.toLocaleDateString("tr-TR")}`,
      tutar: b.tutar + efektifFaiz(b, faizPolitikasi),
      durum: b.durum,
    })),
  ];

  return (
    <SakinPortalClient
      adSoyad={session.adSoyad}
      daireLabel={`${daire.blokId?.ad ?? ""}-${daire.daireNo}`}
      guncelBorc={
        guncelKayit
          ? { tutar: guncelKayit.birimTutar, faiz: guncelFaiz, durum: guncelKayit.durum }
          : null
      }
      gecmis={gecmis}
      ozet={{ toplamOdenen, toplamBekleyen, zamanindaOdeme, yil }}
      iletisim={
        aktifSakin
          ? {
              telefon1: aktifSakin.telefon1 ?? "",
              eposta: aktifSakin.eposta ?? "",
              plaka: aktifSakin.plakalar[0] ?? "",
            }
          : null
      }
    />
  );
}
