import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import Kasa from "@/models/Kasa";
import { logAction } from "@/lib/audit/logAction";
import { HttpError } from "@/lib/http/errors";

export async function gelirGiderSil(params: {
  siteId: string;
  id: string;
  userId: string;
  rol: string;
  ip?: string;
  userAgent?: string;
}) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    const before = await session.withTransaction(async () => {
      const kayit = await GelirGiderKaydi.findOne({ _id: params.id, siteId: params.siteId }).session(session);
      if (!kayit) throw new HttpError(404, "not_found");
      if (kayit.kaynak !== "manuel") {
        // Aidat/ek ödenek tahsilatından gelen kayıtlar yalnızca ilgili durum dropdown'undan geri alınabilir.
        throw new HttpError(400, "otomatik_kayit_silinemez");
      }

      const etki = kayit.tip === "Gelir" ? -kayit.tutar : kayit.tutar;
      await Kasa.updateOne({ _id: kayit.kasaId, siteId: params.siteId }, { $inc: { guncelBakiye: etki } }, { session });
      const snapshot = kayit.toObject();
      await GelirGiderKaydi.deleteOne({ _id: kayit._id }, { session });
      return snapshot;
    });

    await logAction({
      siteId: params.siteId,
      userId: params.userId,
      rol: params.rol,
      action: "gelirgider.delete",
      entityType: "GelirGiderKaydi",
      entityId: params.id,
      before: { tip: before.tip, tutar: before.tutar, kategori: before.kategori, kasaId: before.kasaId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return before;
  } finally {
    await session.endSession();
  }
}
