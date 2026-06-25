const GUN_MS = 1000 * 60 * 60 * 24;

export interface FaizParams {
  birimTutar: number;
  vadeTarihi: Date;
  faizBaslangicGunSayisi: number;
  gunlukFaizOraniYuzde: number;
  hesaplamaTarihi?: Date;
}

/**
 * Gecikme faizi: vade tarihinden `faizBaslangicGunSayisi` gün sonrasından itibaren,
 * günlük basit faiz olarak hesaplanır. Negatif/sıfır gecikme için 0 döner.
 */
export function hesaplaGecikmeFaizi(params: FaizParams): number {
  const hesaplamaTarihi = params.hesaplamaTarihi ?? new Date();
  const gecenGun = Math.floor((hesaplamaTarihi.getTime() - params.vadeTarihi.getTime()) / GUN_MS);
  const faizliGun = Math.max(0, gecenGun - params.faizBaslangicGunSayisi);
  if (faizliGun <= 0) return 0;
  return Math.round(params.birimTutar * (params.gunlukFaizOraniYuzde / 100) * faizliGun);
}
