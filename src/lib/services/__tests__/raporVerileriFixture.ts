import type { RaporVerileri } from "@/lib/services/raporlar";

export const doluRaporVerileri: RaporVerileri = {
  donem: "2026-06",
  yil: 2026,
  aylikGelirGider: [{ kasaAd: "Ana Kasa", gelir: 50000, gider: 12000, net: 38000 }],
  daireBorclari: [{ daireLabel: "A-3", sakin: "Ahmet Şahin", toplamBorc: 1850, kalemSayisi: 2 }],
  kasaHareketDetayi: [
    {
      kasaAd: "Ana Kasa",
      guncelBakiye: 125000,
      yontemler: [{ yontem: "Nakit", gelir: 30000, gider: 5000, adet: 12 }],
    },
  ],
  tahsilatPerformansi: {
    genelOran: 82,
    blokPerformansi: [{ blokAd: "A", oran: 90, odendi: 9, toplam: 10 }],
  },
  firmaOdemeleri: [{ firmaAd: "Öztürk Temizlik", hizmet: "Temizlik", toplamTutar: 8000, islemSayisi: 4 }],
  yillikKonsolide: {
    aylar: [
      { ay: "Oca", gelir: 1000, gider: 500, net: 500 },
      { ay: "Şub", gelir: 1200, gider: 600, net: 600 },
    ],
    toplamGelir: 78000,
    toplamGider: 39000,
  },
};

export const bosRaporVerileri: RaporVerileri = {
  donem: "2026-06",
  yil: 2026,
  aylikGelirGider: [],
  daireBorclari: [],
  kasaHareketDetayi: [],
  tahsilatPerformansi: { genelOran: 0, blokPerformansi: [] },
  firmaOdemeleri: [],
  yillikKonsolide: { aylar: [], toplamGelir: 0, toplamGider: 0 },
};
