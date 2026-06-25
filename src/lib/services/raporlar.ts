import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import Daire from "@/models/Daire";
import AidatKaydi from "@/models/AidatKaydi";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import Kasa from "@/models/Kasa";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import Firma from "@/models/Firma";
import Site from "@/models/Site";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import { efektifFaiz } from "@/lib/services/efektifFaiz";
import { currentDonem } from "@/lib/services/aidatListesi";

export async function getRaporVerileri(siteId: string) {
  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const donem = currentDonem();
  const yil = new Date().getFullYear();
  const yilBaslangic = new Date(yil, 0, 1);
  const yilSonu = new Date(yil + 1, 0, 1);

  const [bloklar, daireler, aidatKayitlari, ekBorclar, kasalar, gelirGiderKayitlari, firmalar, site] =
    await Promise.all([
      Blok.find({ siteId }).lean(),
      Daire.find({ siteId }).populate<{ blokId: { _id: unknown; ad: string } }>("blokId", "ad").lean(),
      AidatKaydi.find({ siteId, donem }).lean(),
      EkOdenekBorcu.find({ siteId }).lean(),
      Kasa.find({ siteId }).lean(),
      GelirGiderKaydi.find({ siteId, tarih: { $gte: yilBaslangic, $lt: yilSonu } })
        .populate<{ kasaId: { _id: unknown; ad: string } }>("kasaId", "ad")
        .populate<{ firmaId: { _id: unknown; ad: string; hizmet?: string } | null }>("firmaId", "ad hizmet")
        .lean(),
      Firma.find({ siteId }).lean(),
      Site.findById(siteId).lean(),
    ]);

  const faizPolitikasi = site?.faizPolitikasi ?? { faizBaslangicGunSayisi: 0, gunlukFaizOraniYuzde: 0 };

  // 1) Aylık Gelir-Gider Raporu (cari dönem, kasa bazında)
  const aylikGelirGider = kasalar.map((k) => {
    const tx = gelirGiderKayitlari.filter(
      (g) => String(g.kasaId?._id) === String(k._id) && g.tarih.toISOString().slice(0, 7) === donem,
    );
    const gelir = tx.filter((t) => t.tip === "Gelir").reduce((a, t) => a + t.tutar, 0);
    const gider = tx.filter((t) => t.tip === "Gider").reduce((a, t) => a + t.tutar, 0);
    return { kasaAd: k.ad, gelir, gider, net: gelir - gider };
  });

  // 2) Daire Bazlı Borç Dökümü (tüm bekleyen/gecikmiş aidat + ek ödenek)
  const daireBorclari = daireler
    .map((d) => {
      const sakin = d.sakinler.find((s) => s.aktif);
      const aidat = aidatKayitlari.filter((a) => String(a.daireId) === String(d._id) && a.durum !== "Odendi");
      const ek = ekBorclar.filter((e) => String(e.daireId) === String(d._id) && e.durum !== "Odendi");
      const toplamBorc =
        aidat.reduce((a, k) => a + k.birimTutar + efektifFaiz(k, faizPolitikasi), 0) +
        ek.reduce((a, k) => a + k.tutar + efektifFaiz(k, faizPolitikasi), 0);
      return {
        daireLabel: `${d.blokId?.ad ?? ""}-${d.daireNo}`,
        sakin: sakin?.adSoyad ?? "—",
        toplamBorc,
        kalemSayisi: aidat.length + ek.length,
      };
    })
    .filter((r) => r.toplamBorc > 0)
    .sort((a, b) => b.toplamBorc - a.toplamBorc);

  // 3) Kasa Hareket Detayı (kasa + ödeme yöntemi kırılımı, cari yıl)
  const kasaHareketDetayi = kasalar.map((k) => {
    const tx = gelirGiderKayitlari.filter((g) => String(g.kasaId?._id) === String(k._id));
    const yontemler = new Map<string, { gelir: number; gider: number; adet: number }>();
    for (const t of tx) {
      const bucket = yontemler.get(t.odemeYontemi) ?? { gelir: 0, gider: 0, adet: 0 };
      if (t.tip === "Gelir") bucket.gelir += t.tutar;
      else bucket.gider += t.tutar;
      bucket.adet += 1;
      yontemler.set(t.odemeYontemi, bucket);
    }
    return {
      kasaAd: k.ad,
      guncelBakiye: k.guncelBakiye,
      yontemler: [...yontemler.entries()].map(([yontem, v]) => ({ yontem, ...v })),
    };
  });

  // 4) Tahsilat Performansı (cari dönem, genel + blok bazlı)
  const genelOdendi = aidatKayitlari.filter((a) => a.durum === "Odendi").length;
  const genelOran = aidatKayitlari.length > 0 ? Math.round((genelOdendi / aidatKayitlari.length) * 100) : 0;
  const blokPerformansi = bloklar.map((b) => {
    const buBlokDaireIds = daireler.filter((d) => String(d.blokId?._id ?? d.blokId) === String(b._id)).map((d) => String(d._id));
    const buBlokKayitlari = aidatKayitlari.filter((a) => buBlokDaireIds.includes(String(a.daireId)));
    const odendi = buBlokKayitlari.filter((a) => a.durum === "Odendi").length;
    return {
      blokAd: b.ad,
      oran: buBlokKayitlari.length > 0 ? Math.round((odendi / buBlokKayitlari.length) * 100) : 0,
      odendi,
      toplam: buBlokKayitlari.length,
    };
  });

  // 5) Firma Ödemeleri (cari yıl, firma bazında toplam gider)
  const firmaOdemeleri = firmalar
    .map((f) => {
      const tx = gelirGiderKayitlari.filter((g) => g.firmaId && String(g.firmaId._id) === String(f._id));
      return {
        firmaAd: f.ad,
        hizmet: f.hizmet ?? "—",
        toplamTutar: tx.reduce((a, t) => a + t.tutar, 0),
        islemSayisi: tx.length,
      };
    })
    .filter((f) => f.islemSayisi > 0)
    .sort((a, b) => b.toplamTutar - a.toplamTutar);

  // 6) Yıllık Konsolide Rapor (ay bazında gelir/gider + toplam)
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const yillikKonsolide = aylar.map((ay, idx) => {
    const tx = gelirGiderKayitlari.filter((g) => g.tarih.getMonth() === idx);
    const gelir = tx.filter((t) => t.tip === "Gelir").reduce((a, t) => a + t.tutar, 0);
    const gider = tx.filter((t) => t.tip === "Gider").reduce((a, t) => a + t.tutar, 0);
    return { ay, gelir, gider, net: gelir - gider };
  });
  const yillikToplamGelir = yillikKonsolide.reduce((a, m) => a + m.gelir, 0);
  const yillikToplamGider = yillikKonsolide.reduce((a, m) => a + m.gider, 0);

  return {
    donem,
    yil,
    aylikGelirGider,
    daireBorclari,
    kasaHareketDetayi,
    tahsilatPerformansi: { genelOran, blokPerformansi },
    firmaOdemeleri,
    yillikKonsolide: { aylar: yillikKonsolide, toplamGelir: yillikToplamGelir, toplamGider: yillikToplamGider },
  };
}

export type RaporVerileri = Awaited<ReturnType<typeof getRaporVerileri>>;
