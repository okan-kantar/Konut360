import PDFDocument from "pdfkit";
import path from "path";
import type { RaporVerileri } from "@/lib/services/raporlar";

/**
 * Geist-Regular.ttf — Next.js'in içinde gelen font, Latin Extended (ISO 8859-9)
 * kapsamındaki Türkçe karakterleri (ğ ü ş ı ö ç) destekler.
 */
const FONT_PATH = path.join(
  process.cwd(),
  "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
);

const RAPORLAR_ADI: Record<string, string> = {
  "gelir-gider": "Aylık Gelir-Gider Raporu",
  "borc-dokumu": "Daire Bazlı Borç Dökümü",
  "kasa-detay": "Kasa Hareket Detayı",
  tahsilat: "Tahsilat Performansı",
  "firma-odemeleri": "Firma Ödemeleri",
  yillik: "Yıllık Konsolide Rapor",
};

const fmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

// ────────────────────────────────────────────────
//  Helper: basit tablo çizici
// ────────────────────────────────────────────────
function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number,
) {
  const rowHeight = 22;
  const headerBg = "#EEF3FF";
  const borderColor = "#D8DCE6";
  const textColor = "#1A2233";
  const headerTextColor = "#4A5568";

  // Başlık satırı
  let x = startX;
  doc.save();
  headers.forEach((h, i) => {
    doc.rect(x, doc.y, colWidths[i], rowHeight).fill(headerBg);
    doc
      .fillColor(headerTextColor)
      .fontSize(8)
      .text(h.toUpperCase(), x + 4, doc.y + 7, {
        width: colWidths[i] - 8,
        align: i === 0 ? "left" : "right",
      });
    x += colWidths[i];
  });
  doc.restore();
  doc.moveDown(rowHeight / doc.currentLineHeight());

  // Veri satırları
  rows.forEach((row, rowIdx) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
    }
    x = startX;
    const rowY = doc.y;
    const isEven = rowIdx % 2 === 0;

    row.forEach((cell, i) => {
      if (!isEven) {
        doc.rect(x, rowY, colWidths[i], rowHeight).fill("#FAFBFF");
      }
      doc
        .fillColor(textColor)
        .fontSize(9)
        .text(cell, x + 4, rowY + 6, {
          width: colWidths[i] - 8,
          align: i === 0 ? "left" : "right",
        });

      // Sağ kenar çizgisi
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(x + colWidths[i], rowY)
        .lineTo(x + colWidths[i], rowY + rowHeight)
        .stroke();

      x += colWidths[i];
    });

    // Alt kenar çizgisi
    doc
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .moveTo(startX, rowY + rowHeight)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), rowY + rowHeight)
      .stroke();

    doc.moveDown(rowHeight / doc.currentLineHeight());
  });
}

// ────────────────────────────────────────────────
//  Rapor bölümleri
// ────────────────────────────────────────────────
function renderGelirGider(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = [usableWidth * 0.4, usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.2];

  if (veri.aylikGelirGider.length === 0) {
    doc.fontSize(10).fillColor("#888").text("Henüz kasa tanımlanmadı.");
    return;
  }

  drawTable(
    doc,
    ["Kasa", "Gelir", "Gider", "Net"],
    veri.aylikGelirGider.map((k) => [k.kasaAd, fmt.format(k.gelir), fmt.format(k.gider), fmt.format(k.net)]),
    colWidths,
    startX,
  );
}

function renderBorcDokumu(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = [usableWidth * 0.25, usableWidth * 0.35, usableWidth * 0.15, usableWidth * 0.25];

  if (veri.daireBorclari.length === 0) {
    doc.fontSize(10).fillColor("#888").text("Borçlu daire yok.");
    return;
  }

  drawTable(
    doc,
    ["Daire", "Sakin", "Kalem", "Toplam Borç"],
    veri.daireBorclari.map((d) => [d.daireLabel, d.sakin, String(d.kalemSayisi), fmt.format(d.toplamBorc)]),
    colWidths,
    startX,
  );
}

function renderKasaDetay(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  if (veri.kasaHareketDetayi.length === 0) {
    doc.fontSize(10).fillColor("#888").text("Henüz kasa tanımlanmadı.");
    return;
  }

  for (const k of veri.kasaHareketDetayi) {
    doc.fontSize(11).fillColor("#1A2233").text(`${k.kasaAd}  —  Bakiye: ${fmt.format(k.guncelBakiye)}`);
    doc.moveDown(0.4);

    if (k.yontemler.length === 0) {
      doc.fontSize(9).fillColor("#888").text("Hareket yok.").moveDown(0.8);
      continue;
    }

    const colWidths = [usableWidth * 0.4, usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.2];
    drawTable(
      doc,
      ["Ödeme Yöntemi", "Adet", "Gelir", "Gider"],
      k.yontemler.map((y) => [y.yontem, String(y.adet), fmt.format(y.gelir), fmt.format(y.gider)]),
      colWidths,
      startX,
    );
    doc.moveDown(0.8);
  }
}

function renderTahsilat(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .fontSize(11)
    .fillColor("#1A2233")
    .text(`Genel tahsilat oranı: %${veri.tahsilatPerformansi.genelOran}`)
    .moveDown(0.8);

  if (veri.tahsilatPerformansi.blokPerformansi.length === 0) {
    doc.fontSize(10).fillColor("#888").text("Henüz blok tanımlanmadı.");
    return;
  }

  const colWidths = [usableWidth * 0.5, usableWidth * 0.25, usableWidth * 0.25];
  drawTable(
    doc,
    ["Blok", "Ödenen / Toplam", "Oran"],
    veri.tahsilatPerformansi.blokPerformansi.map((b) => [
      `${b.blokAd} Blok`,
      `${b.odendi}/${b.toplam}`,
      `%${b.oran}`,
    ]),
    colWidths,
    startX,
  );
}

function renderFirmaOdemeleri(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  if (veri.firmaOdemeleri.length === 0) {
    doc.fontSize(10).fillColor("#888").text("Bu yıl firma ödemesi kaydedilmedi.");
    return;
  }

  const colWidths = [usableWidth * 0.3, usableWidth * 0.3, usableWidth * 0.15, usableWidth * 0.25];
  drawTable(
    doc,
    ["Firma", "Hizmet", "İşlem", "Toplam Ödeme"],
    veri.firmaOdemeleri.map((f) => [f.firmaAd, f.hizmet, String(f.islemSayisi), fmt.format(f.toplamTutar)]),
    colWidths,
    startX,
  );
}

function renderYillik(doc: PDFKit.PDFDocument, veri: RaporVerileri) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .fontSize(11)
    .fillColor("#1A2233")
    .text(
      `Toplam Gelir: ${fmt.format(veri.yillikKonsolide.toplamGelir)}   ` +
        `Toplam Gider: ${fmt.format(veri.yillikKonsolide.toplamGider)}   ` +
        `Net: ${fmt.format(veri.yillikKonsolide.toplamGelir - veri.yillikKonsolide.toplamGider)}`,
    )
    .moveDown(0.8);

  const colWidths = [usableWidth * 0.25, usableWidth * 0.25, usableWidth * 0.25, usableWidth * 0.25];
  drawTable(
    doc,
    ["Ay", "Gelir", "Gider", "Net"],
    veri.yillikKonsolide.aylar.map((a) => [a.ay, fmt.format(a.gelir), fmt.format(a.gider), fmt.format(a.net)]),
    colWidths,
    startX,
  );
}

// ────────────────────────────────────────────────
//  Ana fonksiyon
// ────────────────────────────────────────────────
export function generateRaporPDF(tip: string, veri: RaporVerileri): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // TTF font kaydet — Türkçe karakter desteği sağlar
    doc.registerFont("Geist", FONT_PATH);
    doc.font("Geist");

    // Başlık
    const baslik = RAPORLAR_ADI[tip] ?? tip;
    doc
      .fontSize(18)
      .fillColor("#1A2233")
      .text(baslik, { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text(`Dönem: ${veri.donem}  ·  Yıl: ${veri.yil}`, { align: "center" });

    doc.moveDown(1.5);

    // Ayraç çizgisi
    doc
      .strokeColor("#D8DCE6")
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(1);

    // Rapor içeriği
    switch (tip) {
      case "gelir-gider":
        renderGelirGider(doc, veri);
        break;
      case "borc-dokumu":
        renderBorcDokumu(doc, veri);
        break;
      case "kasa-detay":
        renderKasaDetay(doc, veri);
        break;
      case "tahsilat":
        renderTahsilat(doc, veri);
        break;
      case "firma-odemeleri":
        renderFirmaOdemeleri(doc, veri);
        break;
      case "yillik":
        renderYillik(doc, veri);
        break;
      default:
        doc.fontSize(10).fillColor("#888").text("Bilinmeyen rapor türü.");
    }

    // Alt bilgi
    const totalPages = (doc.bufferedPageRange?.() ?? { count: 1 }).count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(
          `Konut360 · ${new Date().toLocaleDateString("tr-TR")} · Sayfa ${i + 1}/${totalPages}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom - 12,
          { align: "center", width: doc.page.width - doc.page.margins.left - doc.page.margins.right },
        );
    }

    doc.end();
  });
}
