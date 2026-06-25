import { describe, expect, it } from "vitest";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";

describe("getGuncelTutar", () => {
  it("tek kayıt varsa o tutarı döner", () => {
    const grup = { tutarGecmisi: [{ tutar: 1750, gecerliTarih: new Date("2026-01-01") }] };
    expect(getGuncelTutar(grup, new Date("2026-06-01"))).toBe(1750);
  });

  it("hiç kayıt yoksa 0 döner", () => {
    const grup = { tutarGecmisi: [] };
    expect(getGuncelTutar(grup, new Date("2026-06-01"))).toBe(0);
  });

  it("birden fazla kayıt varsa, sorgu tarihinden önceki en yeni tutarı seçer", () => {
    const grup = {
      tutarGecmisi: [
        { tutar: 1500, gecerliTarih: new Date("2025-01-01") },
        { tutar: 1750, gecerliTarih: new Date("2026-01-01") },
        { tutar: 1900, gecerliTarih: new Date("2026-09-01") }, // henüz geçerli değil
      ],
    };
    // 2026-06 döneminde hâlâ 1750 geçerli olmalı (2026-09 tarihli güncelleme henüz uygulanmamış)
    expect(getGuncelTutar(grup, new Date("2026-06-15"))).toBe(1750);
  });

  it("geçmiş dönem tahakkukları yeni tutar güncellemesinden etkilenmez", () => {
    const grup = {
      tutarGecmisi: [
        { tutar: 1750, gecerliTarih: new Date("2026-01-01") },
        { tutar: 1900, gecerliTarih: new Date("2026-07-01") }, // Temmuz'dan itibaren geçerli
      ],
    };
    // Haziran 2026 sorgusu hâlâ eski tutarı (1750) görmeli — geçmiş tahakkuk bozulmamalı
    expect(getGuncelTutar(grup, new Date("2026-06-30"))).toBe(1750);
    // Temmuz 2026 sorgusu yeni tutarı (1900) görmeli
    expect(getGuncelTutar(grup, new Date("2026-07-01"))).toBe(1900);
  });

  it("sorgu tarihi tüm kayıtlardan önceyse en eski tutarı döner (fallback)", () => {
    const grup = {
      tutarGecmisi: [
        { tutar: 1750, gecerliTarih: new Date("2026-06-01") },
        { tutar: 1900, gecerliTarih: new Date("2026-09-01") },
      ],
    };
    expect(getGuncelTutar(grup, new Date("2026-01-01"))).toBe(1750);
  });
});
