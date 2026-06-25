import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import AidatGrubu from "@/models/AidatGrubu";
import AidatKaydi from "@/models/AidatKaydi";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";
import { isDuplicateKeyError } from "@/lib/http/errors";

/** Dönem formatı 'YYYY-MM'. Vade tarihi, ayın `vadeGunu`'üncü günü olarak alınır. */
export async function donemTahakkukUret(params: {
  siteId: string;
  donem: string;
  vadeGunu?: number;
}): Promise<{ olusturulan: number; toplamDaire: number }> {
  await connectDB();
  const [yilStr, ayStr] = params.donem.split("-");
  const yil = Number(yilStr);
  const ay = Number(ayStr);
  const vadeTarihi = new Date(yil, ay - 1, params.vadeGunu ?? 1);

  const [daireler, aidatGruplari] = await Promise.all([
    Daire.find({ siteId: params.siteId }).select("aidatGrubuId").lean(),
    AidatGrubu.find({ siteId: params.siteId }).lean(),
  ]);
  const grupMap = new Map(aidatGruplari.map((g) => [String(g._id), g]));

  let olusturulan = 0;
  for (const daire of daireler) {
    const grup = grupMap.get(String(daire.aidatGrubuId));
    if (!grup) continue;
    const birimTutar = getGuncelTutar(grup, vadeTarihi);
    try {
      await AidatKaydi.create({
        siteId: params.siteId,
        daireId: daire._id,
        donem: params.donem,
        birimTutar,
        vadeTarihi,
        durum: "Bekliyor",
      });
      olusturulan += 1;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      // Bu daire için bu dönem zaten tahakkuk etmiş — atla (idempotent).
    }
  }

  return { olusturulan, toplamDaire: daireler.length };
}
