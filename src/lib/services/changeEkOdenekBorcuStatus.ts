import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import Kasa from "@/models/Kasa";
import { hesaplaGecikmeFaizi } from "@/lib/services/faizHesaplama";
import { logAction } from "@/lib/audit/logAction";
import { HttpError } from "@/lib/http/errors";
import type { AidatDurum } from "@/models/AidatKaydi";

export interface ChangeEkOdenekBorcuStatusParams {
  siteId: string;
  borcId: string;
  yeniDurum: AidatDurum;
  kasaId?: string;
  odemeYontemi?: string;
  userId: string;
  rol: string;
  ip?: string;
  userAgent?: string;
}

/** Aidat durumu için aynı mantık: ödendiğinde otomatik gelir kaydı + kasa bakiyesi güncellemesi. */
export async function changeEkOdenekBorcuStatus(params: ChangeEkOdenekBorcuStatusParams) {
  await connectDB();
  const session = await mongoose.startSession();
  let auditBefore: Record<string, unknown> = {};
  let auditAfter: Record<string, unknown> = {};

  try {
    const sonuc = await session.withTransaction(async () => {
      const borc = await EkOdenekBorcu.findOne({ _id: params.borcId, siteId: params.siteId }).session(session);
      if (!borc) throw new HttpError(404, "not_found");

      auditBefore = { durum: borc.durum, hesaplananFaiz: borc.hesaplananFaiz };

      if (params.yeniDurum === "Odendi" && borc.durum !== "Odendi") {
        if (!params.kasaId) throw new HttpError(400, "kasa_required");
        const kasa = await Kasa.findOne({ _id: params.kasaId, siteId: params.siteId }).session(session);
        if (!kasa) throw new HttpError(400, "kasa_not_found");

        const faiz = hesaplaGecikmeFaizi({
          birimTutar: borc.tutar,
          vadeTarihi: borc.sonOdemeTarihi,
          faizBaslangicGunSayisi: 0,
          gunlukFaizOraniYuzde: borc.faizOraniYuzde,
        });
        const tutar = borc.tutar + faiz;

        const [gelir] = await GelirGiderKaydi.create(
          [
            {
              siteId: params.siteId,
              kasaId: params.kasaId,
              tip: "Gelir",
              tutar,
              tarih: new Date(),
              kategori: "Ek Ödenek",
              odemeYontemi: params.odemeYontemi ?? "Nakit",
              kaynak: "ek-odenek-tahsilat",
              kaynakRefId: borc._id,
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

        borc.durum = "Odendi";
        borc.odemeTarihi = new Date();
        borc.hesaplananFaiz = faiz;
        borc.gelirKaydiId = gelir._id;
      } else if (params.yeniDurum !== "Odendi" && borc.durum === "Odendi") {
        const gelir = await GelirGiderKaydi.findOne({
          siteId: params.siteId,
          kaynak: "ek-odenek-tahsilat",
          kaynakRefId: borc._id,
        }).session(session);
        if (gelir) {
          await Kasa.updateOne(
            { _id: gelir.kasaId, siteId: params.siteId },
            { $inc: { guncelBakiye: -gelir.tutar } },
            { session },
          );
          await GelirGiderKaydi.deleteOne({ _id: gelir._id }, { session });
        }
        borc.durum = params.yeniDurum;
        borc.odemeTarihi = undefined;
        borc.gelirKaydiId = undefined;
      } else {
        // Manuel "Gecikti" geçişi: son ödeme tarihi geçmemiş kayıtlara izin verme
        if (params.yeniDurum === "Gecikti" && new Date() <= borc.sonOdemeTarihi) {
          throw new HttpError(400, "vade_tarihi_gecmedi");
        }
        borc.durum = params.yeniDurum;
      }

      await borc.save({ session });
      auditAfter = { durum: borc.durum, hesaplananFaiz: borc.hesaplananFaiz };
      return borc.toObject();
    });

    await logAction({
      siteId: params.siteId,
      userId: params.userId,
      rol: params.rol,
      action: "ekodenek_borcu.status_change",
      entityType: "EkOdenekBorcu",
      entityId: params.borcId,
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
