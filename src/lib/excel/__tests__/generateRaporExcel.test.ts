import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generateRaporExcel } from "@/lib/excel/generateRaporExcel";
import { doluRaporVerileri, bosRaporVerileri } from "@/lib/services/__tests__/raporVerileriFixture";

const RAPOR_TIPLERI = ["gelir-gider", "borc-dokumu", "kasa-detay", "tahsilat", "firma-odemeleri", "yillik"] as const;

async function workbookSatirSayisi(buffer: Buffer): Promise<number> {
  const wb = new ExcelJS.Workbook();
  // exceljs'in kendi index.d.ts'i "Buffer extends ArrayBuffer {}" şeklinde yerel bir
  // shim tanımlıyor; bu, Node'un gerçek Buffer'ından farklı olduğu için load()'a
  // doğrudan geçirmek tip hatası veriyor (çalışma zamanında sorunsuz).
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  return wb.worksheets[0].rowCount;
}

describe("generateRaporExcel", () => {
  it.each(RAPOR_TIPLERI)("%s için geçerli bir xlsx buffer üretir (dolu veri)", async (tip) => {
    const buffer = await generateRaporExcel(tip, doluRaporVerileri);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    const satirSayisi = await workbookSatirSayisi(buffer);
    expect(satirSayisi).toBeGreaterThan(3);
  });

  it.each(RAPOR_TIPLERI)("%s için boş veride de hata vermeden bir xlsx üretir", async (tip) => {
    const buffer = await generateRaporExcel(tip, bosRaporVerileri);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    const satirSayisi = await workbookSatirSayisi(buffer);
    expect(satirSayisi).toBeGreaterThan(0);
  });

  it("bilinmeyen rapor türü için de hata fırlatmadan bir dosya üretir", async () => {
    const buffer = await generateRaporExcel("bilinmeyen-tip", doluRaporVerileri);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
  });
});
