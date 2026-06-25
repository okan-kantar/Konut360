import type { IAidatGrubu } from "@/models/AidatGrubu";

/** Belirtilen tarihte (varsayılan: şimdi) geçerli olan aidat tutarını döner. */
export function getGuncelTutar(grup: Pick<IAidatGrubu, "tutarGecmisi">, atDate: Date = new Date()): number {
  const gecerliler = grup.tutarGecmisi
    .filter((g) => g.gecerliTarih.getTime() <= atDate.getTime())
    .sort((a, b) => b.gecerliTarih.getTime() - a.gecerliTarih.getTime());
  if (gecerliler.length > 0) return gecerliler[0].tutar;
  // Henüz hiçbir kayıt geçerli olmadıysa (ileri tarihli), en eski tutarı kullan.
  const tumu = [...grup.tutarGecmisi].sort((a, b) => a.gecerliTarih.getTime() - b.gecerliTarih.getTime());
  return tumu[0]?.tutar ?? 0;
}
