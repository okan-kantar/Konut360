import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import EkOdenek, { type EkOdenekKapsam } from "@/models/EkOdenek";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";

export async function ekOdenekOlustur(params: {
  siteId: string;
  ad: string;
  kapsam: EkOdenekKapsam;
  kapsamRefIds: string[];
  tutar: number;
  sonOdemeTarihi: Date;
  faizOraniYuzde: number;
}) {
  await connectDB();

  const ekOdenek = await EkOdenek.create({
    siteId: params.siteId,
    ad: params.ad,
    kapsam: params.kapsam,
    kapsamRefIds: params.kapsamRefIds,
    tutar: params.tutar,
    sonOdemeTarihi: params.sonOdemeTarihi,
    faizOraniYuzde: params.faizOraniYuzde,
  });

  const daireFilter: Record<string, unknown> = { siteId: params.siteId };
  if (params.kapsam === "Blok") daireFilter.blokId = { $in: params.kapsamRefIds };
  else if (params.kapsam === "Secili") daireFilter._id = { $in: params.kapsamRefIds };

  const daireler = await Daire.find(daireFilter).select("_id").lean();
  if (daireler.length > 0) {
    await EkOdenekBorcu.insertMany(
      daireler.map((d) => ({
        siteId: params.siteId,
        ekOdenekId: ekOdenek._id,
        daireId: d._id,
        tutar: params.tutar,
        sonOdemeTarihi: params.sonOdemeTarihi,
        faizOraniYuzde: params.faizOraniYuzde,
        durum: "Bekliyor",
      })),
    );
  }

  return { ekOdenek, daireSayisi: daireler.length };
}
