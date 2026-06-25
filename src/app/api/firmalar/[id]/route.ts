import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Firma from "@/models/Firma";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const patchSchema = z.object({
  ad: z.string().min(1).max(150).optional(),
  tur: z.enum(["GercekKisi", "TuzelKisi"]).optional(),
  hizmet: z.string().max(80).optional(),
  yetkili: z.string().max(120).optional(),
  vergiDairesi: z.string().max(120).optional(),
  vergiNoTckn: z.string().max(40).optional(),
  iban: z.string().max(40).optional(),
  adres: z.string().max(300).optional(),
  iletisim: z.string().max(120).optional(),
  ekIrtibat: z.string().max(120).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("firma:manage");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const firma = await Firma.findOne({ _id: id, siteId: session.siteId });
    if (!firma) throw new HttpError(404, "not_found");

    const before = { ad: firma.ad, tur: firma.tur };
    Object.assign(firma, parsed.data);
    await firma.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "firma.update",
      entityType: "Firma",
      entityId: id,
      before,
      after: parsed.data,
    });

    return NextResponse.json({ id: firma.id, ad: firma.ad, tur: firma.tur });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("firma:manage");
    const { id } = await params;

    await connectDB();
    const firma = await Firma.findOne({ _id: id, siteId: session.siteId });
    if (!firma) throw new HttpError(404, "not_found");

    // Ödeme kaydı olan firma silinemez
    const odemeKaydiSayisi = await GelirGiderKaydi.countDocuments({
      firmaId: id,
      siteId: session.siteId,
    });
    if (odemeKaydiSayisi > 0) throw new HttpError(409, "firma_has_kayitlar");

    await firma.deleteOne();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "firma.delete",
      entityType: "Firma",
      entityId: id,
      before: { ad: firma.ad, tur: firma.tur },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
