import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import AidatKaydi, { type AidatDurum } from "@/models/AidatKaydi";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import Kasa from "@/models/Kasa";
import Site from "@/models/Site";
import { hesaplaGecikmeFaizi } from "@/lib/services/faizHesaplama";
import { logAction } from "@/lib/audit/logAction";
import { HttpError } from "@/lib/http/errors";

export interface ChangeAidatStatusParams {
  siteId: string;
  aidatId: string;
  yeniDurum: AidatDurum;
  kasaId?: string;
  odemeYontemi?: string;
  userId: string;
  rol: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Aidat durumunu değiştirir. "Odendi" işaretlenince kasaya otomatik gelir kaydı
 * işlenir; geri alınırsa ilişkili gelir kaydı ve kasa bakiyesi de geri alınır.
 * Replica set gerektirir (transaction kullanır) — bkz. README.
 */
export async function changeAidatStatus(params: ChangeAidatStatusParams) {
  await connectDB();
  const session = await mongoose.startSession();
  let auditBefore: Record<string, unknown> = {};
  let auditAfter: Record<string, unknown> = {};

  try {
    const sonuc = await session.withTransaction(async () => {
      const kayit = await AidatKaydi.findOne({ _id: params.aidatId, siteId: params.siteId }).session(session);
      if (!kayit) throw new HttpError(404, "not_found");

      auditBefore = { durum: kayit.durum, hesaplananFaiz: kayit.hesaplananFaiz };

      if (params.yeniDurum === "Odendi" && kayit.durum !== "Odendi") {
        if (!params.kasaId) throw new HttpError(400, "kasa_required");
        const kasa = await Kasa.findOne({ _id: params.kasaId, siteId: params.siteId }).session(session);
        if (!kasa) throw new HttpError(400, "kasa_not_found");

        const site = await Site.findById(params.siteId).session(session);
        const faiz = hesaplaGecikmeFaizi({
          birimTutar: kayit.birimTutar,
          vadeTarihi: kayit.vadeTarihi,
          faizBaslangicGunSayisi: site?.faizPolitikasi.faizBaslangicGunSayisi ?? 0,
          gunlukFaizOraniYuzde: site?.faizPolitikasi.gunlukFaizOraniYuzde ?? 0,
        });
        const tutar = kayit.birimTutar + faiz;

        const [gelir] = await GelirGiderKaydi.create(
          [
            {
              siteId: params.siteId,
              kasaId: params.kasaId,
              tip: "Gelir",
              tutar,
              tarih: new Date(),
              kategori: "Aidat",
              odemeYontemi: params.odemeYontemi ?? "Nakit",
              kaynak: "aidat-tahsilat",
              kaynakRefId: kayit._id,
              createdBy: params.userId,
            },
          ],
          { session },
        );
        await Kasa.updateOne(
          { _id: params.kasaId, siteId: params.siteId },
          { $inc: { guncelBakiye: tutar } },
          { session },
        );

        kayit.durum = "Odendi";
        kayit.odemeTarihi = new Date();
        kayit.hesaplananFaiz = faiz;
        kayit.gelirKaydiId = gelir._id;
      } else if (params.yeniDurum !== "Odendi" && kayit.durum === "Odendi") {
        const gelir = await GelirGiderKaydi.findOne({
          siteId: params.siteId,
          kaynak: "aidat-tahsilat",
          kaynakRefId: kayit._id,
        }).session(session);
        if (gelir) {
          await Kasa.updateOne(
            { _id: gelir.kasaId, siteId: params.siteId },
            { $inc: { guncelBakiye: -gelir.tutar } },
            { session },
          );
          await GelirGiderKaydi.deleteOne({ _id: gelir._id }, { session });
        }
        kayit.durum = params.yeniDurum;
        kayit.odemeTarihi = undefined;
        kayit.gelirKaydiId = undefined;
      } else {
        // Manuel "Gecikti" geçişi: vade tarihi geçmemiş kayıtlara izin verme
        if (params.yeniDurum === "Gecikti" && new Date() <= kayit.vadeTarihi) {
          throw new HttpError(400, "vade_tarihi_gecmedi");
        }
        kayit.durum = params.yeniDurum;
      }

      await kayit.save({ session });
      auditAfter = { durum: kayit.durum, hesaplananFaiz: kayit.hesaplananFaiz };
      return kayit.toObject();
    });

    await logAction({
      siteId: params.siteId,
      userId: params.userId,
      rol: params.rol,
      action: "aidat.status_change",
      entityType: "AidatKaydi",
      entityId: params.aidatId,
      before: auditBefore,
      after: auditAfter,
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return sonuc;
  } finally {
    await session.endSession();
  }
}
