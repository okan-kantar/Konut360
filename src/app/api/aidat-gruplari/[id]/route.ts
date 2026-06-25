import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import AidatGrubu from "@/models/AidatGrubu";
import Daire from "@/models/Daire";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const patchSchema = z.object({
  tutar: z.coerce.number().min(0),
  gecerliTarih: z.string().optional(), // ISO date string; varsayılan: bugün
});

/**
 * Aidat grubu tutarını günceller. Geçmiş korunur — yeni tutar tutarGecmisi dizisine eklenir.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("tanim:manage");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const grup = await AidatGrubu.findOne({ _id: id, siteId: session.siteId });
    if (!grup) throw new HttpError(404, "not_found");

    const eskiTutar = getGuncelTutar(grup);
    const gecerliTarih = parsed.data.gecerliTarih
      ? new Date(parsed.data.gecerliTarih)
      : new Date();

    grup.tutarGecmisi.push({ tutar: parsed.data.tutar, gecerliTarih });
    await grup.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "aidat_grubu.tutar_guncelle",
      entityType: "AidatGrubu",
      entityId: id,
      before: { tutar: eskiTutar },
      after: { tutar: parsed.data.tutar, gecerliTarih },
    });

    return NextResponse.json({ id: grup.id, ad: grup.ad, guncelTutar: parsed.data.tutar });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("tanim:manage");
    const { id } = await params;

    await connectDB();
    const grup = await AidatGrubu.findOne({ _id: id, siteId: session.siteId });
    if (!grup) throw new HttpError(404, "not_found");

    // Bu gruba bağlı daire varsa silmeye izin verme
    const daireSayisi = await Daire.countDocuments({ aidatGrubuId: id, siteId: session.siteId });
    if (daireSayisi > 0) throw new HttpError(409, "grup_has_daireler");

    await grup.deleteOne();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "aidat_grubu.delete",
      entityType: "AidatGrubu",
      entityId: id,
      before: { ad: grup.ad },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
