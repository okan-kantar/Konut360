import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import GelirGiderKaydi, { type GelirGiderTip } from "@/models/GelirGiderKaydi";
import Kasa from "@/models/Kasa";
import { logAction } from "@/lib/audit/logAction";
import { HttpError } from "@/lib/http/errors";

export interface GelirGiderEkleParams {
  siteId: string;
  kasaId: string;
  tip: GelirGiderTip;
  kategori: string;
  tutar: number;
  tarih: Date;
  odemeYontemi: string;
  aciklama?: string;
  firmaId?: string;
  userId: string;
  rol: string;
  ip?: string;
  userAgent?: string;
}

export async function gelirGiderEkle(params: GelirGiderEkleParams) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    const kayit = await session.withTransaction(async () => {
      const kasa = await Kasa.findOne({ _id: params.kasaId, siteId: params.siteId }).session(session);
      if (!kasa) throw new HttpError(400, "kasa_not_found");

      const etki = params.tip === "Gelir" ? params.tutar : -params.tutar;
      const [gg] = await GelirGiderKaydi.create(
        [
          {
            siteId: params.siteId,
            kasaId: params.kasaId,
            tip: params.tip,
            kategori: params.kategori,
            tutar: params.tutar,
            tarih: params.tarih,
            odemeYontemi: params.odemeYontemi,
            aciklama: params.aciklama,
            firmaId: params.firmaId,
            kaynak: "manuel",
            createdBy: params.userId,
          },
        ],
        { session },
      );
      await Kasa.updateOne({ _id: params.kasaId, siteId: params.siteId }, { $inc: { guncelBakiye: etki } }, { session });
      return gg.toObject();
    });

    await logAction({
      siteId: params.siteId,
      userId: params.userId,
      rol: params.rol,
      action: "gelirgider.create",
      entityType: "GelirGiderKaydi",
      entityId: String(kayit._id),
      after: { tip: params.tip, tutar: params.tutar, kategori: params.kategori, kasaId: params.kasaId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return kayit;
  } finally {
    await session.endSession();
  }
}
