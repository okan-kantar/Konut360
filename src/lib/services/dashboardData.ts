import { connectDB } from "@/lib/db/connect";
import Kasa from "@/models/Kasa";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import { getAidatListesi, currentDonem } from "@/lib/services/aidatListesi";

const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DONUT_PALETTE = ["#16307A", "#2D5BFF", "#5B86F2", "#8FAEF7", "#B9CCFB", "#DCE6FB"];

interface KasaLean {
  ad: string;
}

async function getAylikGelirGider(siteId: string, aySayisi: number) {
  const now = new Date();
  const baslangic = new Date(now.getFullYear(), now.getMonth() - (aySayisi - 1), 1);
  const kayitlar = await GelirGiderKaydi.find({ siteId, tarih: { $gte: baslangic } })
    .select("tip tutar tarih")
    .lean();

  const aylar = Array.from({ length: aySayisi }, (_, idx) => {
    const i = aySayisi - 1 - idx;
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, ay: AY_KISA[d.getMonth()], gelir: 0, gider: 0 };
  });
  const map = new Map(aylar.map((a) => [a.key, a]));

  for (const k of kayitlar) {
    const tarih = new Date(k.tarih);
    const bucket = map.get(`${tarih.getFullYear()}-${tarih.getMonth()}`);
    if (!bucket) continue;
    if (k.tip === "Gelir") bucket.gelir += k.tutar;
    else bucket.gider += k.tutar;
  }

  return aylar;
}

export async function getDashboardData(siteId: string) {
  await connectDB();
  const donem = currentDonem();

  const [kasalar, aidatSonuc, sonHareketler, tumGiderler, aylikGelirGider] = await Promise.all([
    Kasa.find({ siteId }).lean(),
    getAidatListesi(siteId, donem),
    GelirGiderKaydi.find({ siteId })
      .sort({ tarih: -1, createdAt: -1 })
      .limit(5)
      .populate<{ kasaId: KasaLean }>("kasaId", "ad")
      .lean(),
    GelirGiderKaydi.find({ siteId, tip: "Gider" }).select("kategori tutar").lean(),
    getAylikGelirGider(siteId, 6),
  ]);

  const giderKategoriToplam = new Map<string, number>();
  for (const g of tumGiderler) {
    giderKategoriToplam.set(g.kategori, (giderKategoriToplam.get(g.kategori) ?? 0) + g.tutar);
  }
  const giderToplam = [...giderKategoriToplam.values()].reduce((a, b) => a + b, 0);
  const giderDagilimi = [...giderKategoriToplam.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kategori, tutar], i) => ({
      kategori,
      tutar,
      yuzde: giderToplam > 0 ? Math.round((tutar / giderToplam) * 100) : 0,
      renk: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));

  const { kpi } = aidatSonuc;

  return {
    donem,
    anaKasaToplami: kasalar.reduce((a, k) => a + k.guncelBakiye, 0),
    tahsilEdilenAidat: kpi.tahsilEdilen,
    bekleyenTahsilat: kpi.bekleyen + kpi.gecikmis,
    tahsilatOrani: kpi.toplam > 0 ? Math.round((kpi.odendiSayisi / kpi.toplam) * 100) : 0,
    odendiSayisi: kpi.odendiSayisi,
    bekliyorSayisi: kpi.bekliyorSayisi,
    geciktiSayisi: kpi.geciktiSayisi,
    toplamDaire: kpi.toplam,
    aylikGelirGider,
    sonHareketler: sonHareketler.map((h) => ({
      id: String(h._id),
      aciklama: h.aciklama || h.kategori,
      tarih: h.tarih,
      kasaAd: h.kasaId?.ad ?? "",
      kategori: h.kategori,
      tutar: h.tutar,
      tip: h.tip,
    })),
    giderDagilimi,
    giderToplam,
  };
}
