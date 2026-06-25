import ExcelJS from "exceljs";
import type { RaporVerileri } from "@/lib/services/raporlar";

const RAPORLAR_ADI: Record<string, string> = {
  "gelir-gider": "Aylık Gelir-Gider Raporu",
  "borc-dokumu": "Daire Bazlı Borç Dökümü",
  "kasa-detay": "Kasa Hareket Detayı",
  tahsilat: "Tahsilat Performansı",
  "firma-odemeleri": "Firma Ödemeleri",
  yillik: "Yıllık Konsolide Rapor",
};

const HEADER_BG = "FFEEF3FF";
const HEADER_TEXT = "FF4A5568";
const ZEBRA_BG = "FFFAFBFF";
const TITLE_TEXT = "FF1A2233";
const MUTED_TEXT = "FF6B7280";

function basliklar(sheet: ExcelJS.Worksheet, headers: string[]) {
  const row = sheet.addRow(headers);
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
  });
  return row;
}

function veriSatiri(sheet: ExcelJS.Worksheet, values: (string | number)[], zebra: boolean) {
  const row = sheet.addRow(values);
  if (zebra) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_BG } };
    });
  }
  return row;
}

function sayiKolonu(sheet: ExcelJS.Worksheet, kolonNo: number) {
  const col = sheet.getColumn(kolonNo);
  col.numFmt = '#,##0.00\\ "₺"';
  col.alignment = { horizontal: "right" };
  col.width = Math.max(col.width ?? 0, 18);
}

function notSatiri(sheet: ExcelJS.Worksheet, mesaj: string) {
  const row = sheet.addRow([mesaj]);
  row.font = { italic: true, color: { argb: MUTED_TEXT } };
}

function renderGelirGider(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  if (veri.aylikGelirGider.length === 0) {
    notSatiri(sheet, "Henüz kasa tanımlanmadı.");
    return;
  }
  basliklar(sheet, ["Kasa", "Gelir", "Gider", "Net"]);
  veri.aylikGelirGider.forEach((k, i) => veriSatiri(sheet, [k.kasaAd, k.gelir, k.gider, k.net], i % 2 === 1));
  [2, 3, 4].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 28;
}

function renderBorcDokumu(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  if (veri.daireBorclari.length === 0) {
    notSatiri(sheet, "Borçlu daire yok.");
    return;
  }
  basliklar(sheet, ["Daire", "Sakin", "Kalem", "Toplam Borç"]);
  veri.daireBorclari.forEach((d, i) =>
    veriSatiri(sheet, [d.daireLabel, d.sakin, d.kalemSayisi, d.toplamBorc], i % 2 === 1),
  );
  [3, 4].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 26;
}

function renderKasaDetay(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  if (veri.kasaHareketDetayi.length === 0) {
    notSatiri(sheet, "Henüz kasa tanımlanmadı.");
    return;
  }
  basliklar(sheet, ["Kasa", "Güncel Bakiye", "Ödeme Yöntemi", "Adet", "Gelir", "Gider"]);
  let zebra = false;
  for (const k of veri.kasaHareketDetayi) {
    if (k.yontemler.length === 0) {
      veriSatiri(sheet, [k.kasaAd, k.guncelBakiye, "—", 0, 0, 0], zebra);
      zebra = !zebra;
      continue;
    }
    for (const y of k.yontemler) {
      veriSatiri(sheet, [k.kasaAd, k.guncelBakiye, y.yontem, y.adet, y.gelir, y.gider], zebra);
      zebra = !zebra;
    }
  }
  [2, 4, 5, 6].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 22;
  sheet.getColumn(3).width = 20;
}

function renderTahsilat(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  basliklar(sheet, ["Blok", "Ödenen", "Toplam", "Oran (%)"]);
  veriSatiri(sheet, ["Genel", "", "", veri.tahsilatPerformansi.genelOran], false).font = { bold: true };
  if (veri.tahsilatPerformansi.blokPerformansi.length === 0) {
    notSatiri(sheet, "Henüz blok tanımlanmadı.");
    return;
  }
  veri.tahsilatPerformansi.blokPerformansi.forEach((b, i) =>
    veriSatiri(sheet, [`${b.blokAd} Blok`, b.odendi, b.toplam, b.oran], i % 2 === 1),
  );
  [2, 3, 4].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 20;
}

function renderFirmaOdemeleri(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  if (veri.firmaOdemeleri.length === 0) {
    notSatiri(sheet, "Bu yıl firma ödemesi kaydedilmedi.");
    return;
  }
  basliklar(sheet, ["Firma", "Hizmet", "İşlem", "Toplam Ödeme"]);
  veri.firmaOdemeleri.forEach((f, i) =>
    veriSatiri(sheet, [f.firmaAd, f.hizmet, f.islemSayisi, f.toplamTutar], i % 2 === 1),
  );
  [3, 4].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 20;
}

function renderYillik(sheet: ExcelJS.Worksheet, veri: RaporVerileri) {
  basliklar(sheet, ["Ay", "Gelir", "Gider", "Net"]);
  veri.yillikKonsolide.aylar.forEach((a, i) => veriSatiri(sheet, [a.ay, a.gelir, a.gider, a.net], i % 2 === 1));
  const toplamNet = veri.yillikKonsolide.toplamGelir - veri.yillikKonsolide.toplamGider;
  veriSatiri(sheet, ["TOPLAM", veri.yillikKonsolide.toplamGelir, veri.yillikKonsolide.toplamGider, toplamNet], false).font = {
    bold: true,
  };
  [2, 3, 4].forEach((c) => sayiKolonu(sheet, c));
  sheet.getColumn(1).width = 14;
}

export async function generateRaporExcel(tip: string, veri: RaporVerileri): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Konut360";
  workbook.created = new Date();

  const baslik = RAPORLAR_ADI[tip] ?? tip;
  const sheet = workbook.addWorksheet(baslik.slice(0, 31));

  sheet.addRow([baslik]).font = { bold: true, size: 14, color: { argb: TITLE_TEXT } };
  sheet.addRow([`Dönem: ${veri.donem}  ·  Yıl: ${veri.yil}`]).font = { size: 10, color: { argb: MUTED_TEXT } };
  sheet.addRow([]);

  switch (tip) {
    case "gelir-gider":
      renderGelirGider(sheet, veri);
      break;
    case "borc-dokumu":
      renderBorcDokumu(sheet, veri);
      break;
    case "kasa-detay":
      renderKasaDetay(sheet, veri);
      break;
    case "tahsilat":
      renderTahsilat(sheet, veri);
      break;
    case "firma-odemeleri":
      renderFirmaOdemeleri(sheet, veri);
      break;
    case "yillik":
      renderYillik(sheet, veri);
      break;
    default:
      notSatiri(sheet, "Bilinmeyen rapor türü.");
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
