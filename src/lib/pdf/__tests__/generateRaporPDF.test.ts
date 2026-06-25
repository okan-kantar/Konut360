import { describe, expect, it } from "vitest";
import { generateRaporPDF } from "@/lib/pdf/generateRaporPDF";
import { doluRaporVerileri, bosRaporVerileri } from "@/lib/services/__tests__/raporVerileriFixture";

const RAPOR_TIPLERI = ["gelir-gider", "borc-dokumu", "kasa-detay", "tahsilat", "firma-odemeleri", "yillik"] as const;

describe("generateRaporPDF", () => {
  it.each(RAPOR_TIPLERI)("%s için geçerli bir PDF buffer üretir (dolu veri)", async (tip) => {
    const buffer = await generateRaporPDF(tip, doluRaporVerileri);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it.each(RAPOR_TIPLERI)("%s için boş veride de hata vermeden bir PDF üretir", async (tip) => {
    const buffer = await generateRaporPDF(tip, bosRaporVerileri);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("bilinmeyen rapor türü için de hata fırlatmadan bir PDF üretir", async () => {
    const buffer = await generateRaporPDF("bilinmeyen-tip", doluRaporVerileri);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
