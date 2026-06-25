import { connectDB } from "@/lib/db/connect";
import AidatKaydi from "@/models/AidatKaydi";
import Site from "@/models/Site";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import { hesaplaGecikmeFaizi } from "@/lib/services/faizHesaplama";

export function currentDonem(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface DaireLean {
  daireNo: string;
  blokId: { _id: unknown; ad: string } | null;
  sakinler: { adSoyad: string; aktif: boolean }[];
  aidatGrubuId: { ad: string } | null;
}

export interface AidatSatiri {
  id: string;
  daireNo: string;
  blokId: string | null;
  blokAd: string;
  sakin: string;
  aidatGrubuAd: string;
  tutar: number;
  faiz: number;
  durum: "Bekliyor" | "Gecikti" | "Odendi";
}

export interface AidatKpi {
  tahsilEdilen: number;
  bekleyen: number;
  gecikmis: number;
  odendiSayisi: number;
  bekliyorSayisi: number;
  geciktiSayisi: number;
  toplam: number;
}

export async function getAidatListesi(
  siteId: string,
  donem: string,
  blokId?: string | null,
): Promise<{ donem: string; rows: AidatSatiri[]; kpi: AidatKpi }> {
  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const site = await Site.findById(siteId).lean();
  const faizPolitikasi = site?.faizPolitikasi ?? { faizBaslangicGunSayisi: 0, gunlukFaizOraniYuzde: 0 };

  const kayitlar = await AidatKaydi.find({ siteId, donem })
    .populate<{ daireId: DaireLean }>({
      path: "daireId",
      select: "daireNo blokId sakinler aidatGrubuId",
      populate: [
        { path: "blokId", select: "ad" },
        { path: "aidatGrubuId", select: "ad" },
      ],
    })
    .lean();

  const rows = kayitlar
    .filter((k) => k.daireId)
    .map((k) => {
      const daire = k.daireId as unknown as DaireLean;
      const sakin = daire.sakinler.find((s) => s.aktif);
      const faiz =
        k.durum === "Gecikti"
          ? hesaplaGecikmeFaizi({
              birimTutar: k.birimTutar,
              vadeTarihi: k.vadeTarihi,
              faizBaslangicGunSayisi: faizPolitikasi.faizBaslangicGunSayisi,
              gunlukFaizOraniYuzde: faizPolitikasi.gunlukFaizOraniYuzde,
            })
          : k.hesaplananFaiz;
      return {
        id: String(k._id),
        daireNo: daire.daireNo,
        blokId: daire.blokId ? String(daire.blokId._id) : null,
        blokAd: daire.blokId?.ad ?? "",
        sakin: sakin?.adSoyad ?? "—",
        aidatGrubuAd: daire.aidatGrubuId?.ad ?? "",
        tutar: k.birimTutar,
        faiz,
        durum: k.durum,
      };
    })
    .filter((r) => !blokId || r.blokId === blokId)
    .sort((a, b) => `${a.blokAd}-${a.daireNo}`.localeCompare(`${b.blokAd}-${b.daireNo}`));

  const odendi = rows.filter((r) => r.durum === "Odendi");
  const bekliyor = rows.filter((r) => r.durum === "Bekliyor");
  const gecikti = rows.filter((r) => r.durum === "Gecikti");

  return {
    donem,
    rows,
    kpi: {
      tahsilEdilen: odendi.reduce((a, r) => a + r.tutar + r.faiz, 0),
      bekleyen: bekliyor.reduce((a, r) => a + r.tutar, 0),
      gecikmis: gecikti.reduce((a, r) => a + r.tutar + r.faiz, 0),
      odendiSayisi: odendi.length,
      bekliyorSayisi: bekliyor.length,
      geciktiSayisi: gecikti.length,
      toplam: rows.length,
    },
  };
}
