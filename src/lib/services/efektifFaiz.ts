import { hesaplaGecikmeFaizi } from "@/lib/services/faizHesaplama";
import type { IFaizPolitikasi } from "@/models/Site";

/** "Gecikti" kayıtlar için faizi canlı hesaplar; "Odendi" kayıtlar için dondurulmuş değeri döner. */
export function efektifFaiz(
  kayit: { durum: string; birimTutar?: number; tutar?: number; vadeTarihi?: Date; sonOdemeTarihi?: Date; hesaplananFaiz: number },
  faizPolitikasi: IFaizPolitikasi,
): number {
  if (kayit.durum !== "Gecikti") return kayit.hesaplananFaiz;
  return hesaplaGecikmeFaizi({
    birimTutar: kayit.birimTutar ?? kayit.tutar ?? 0,
    vadeTarihi: kayit.vadeTarihi ?? kayit.sonOdemeTarihi ?? new Date(),
    faizBaslangicGunSayisi: faizPolitikasi.faizBaslangicGunSayisi,
    gunlukFaizOraniYuzde: faizPolitikasi.gunlukFaizOraniYuzde,
  });
}
