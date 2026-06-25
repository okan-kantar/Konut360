import { describe, expect, it } from "vitest";
import { hesaplaGecikmeFaizi } from "@/lib/services/faizHesaplama";

const GUN_MS = 1000 * 60 * 60 * 24;

describe("hesaplaGecikmeFaizi", () => {
  it("vade henüz gelmemişse (hesaplama tarihi vadeden önce) 0 döner", () => {
    const vade = new Date("2026-06-15");
    const hesap = new Date("2026-06-10");
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 1750,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 0,
      gunlukFaizOraniYuzde: 0.1,
      hesaplamaTarihi: hesap,
    });
    expect(faiz).toBe(0);
  });

  it("faizBaslangicGunSayisi'ndan az gecikme varsa 0 döner", () => {
    const vade = new Date("2026-06-01");
    const hesap = new Date(vade.getTime() + 2 * GUN_MS); // 2 gün gecikme
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 1750,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 5, // faiz 5 günden sonra başlıyor
      gunlukFaizOraniYuzde: 0.1,
      hesaplamaTarihi: hesap,
    });
    expect(faiz).toBe(0);
  });

  it("faizBaslangicGunSayisi sonrası günler için doğru hesaplar", () => {
    const vade = new Date("2026-06-01");
    const hesap = new Date(vade.getTime() + 10 * GUN_MS); // 10 gün gecikme
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 1750,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 0,
      gunlukFaizOraniYuzde: 0.1, // %0.1/gün
      hesaplamaTarihi: hesap,
    });
    // 1750 * 0.001 * 10 = 17.5 -> round -> 18
    expect(faiz).toBe(18);
  });

  it("faizBaslangicGunSayisi varken sadece faizli günler hesaba katılır", () => {
    const vade = new Date("2026-06-01");
    const hesap = new Date(vade.getTime() + 10 * GUN_MS); // 10 gün gecikme
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 1750,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 5, // ilk 5 gün faizsiz
      gunlukFaizOraniYuzde: 0.1,
      hesaplamaTarihi: hesap,
    });
    // faizli gün = 10 - 5 = 5 -> 1750 * 0.001 * 5 = 8.75 -> round -> 9
    expect(faiz).toBe(9);
  });

  it("hesaplamaTarihi verilmezse şimdiki zamanı kullanır (negatif olmayan sonuç)", () => {
    const vade = new Date(Date.now() - 5 * GUN_MS);
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 1000,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 0,
      gunlukFaizOraniYuzde: 0.1,
    });
    expect(faiz).toBeGreaterThanOrEqual(0);
  });

  it("tutar 0 ise faiz de 0 olur", () => {
    const vade = new Date("2026-06-01");
    const hesap = new Date(vade.getTime() + 30 * GUN_MS);
    const faiz = hesaplaGecikmeFaizi({
      birimTutar: 0,
      vadeTarihi: vade,
      faizBaslangicGunSayisi: 0,
      gunlukFaizOraniYuzde: 0.1,
      hesaplamaTarihi: hesap,
    });
    expect(faiz).toBe(0);
  });
});
