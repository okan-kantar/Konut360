import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import Daire from "@/models/Daire";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const patchSchema = z.object({
  ad: z.string().min(1).max(60).optional(),
  katSayisi: z.coerce.number().min(0).max(200).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const blok = await Blok.findOne({ _id: id, siteId: session.siteId });
    if (!blok) throw new HttpError(404, "not_found");

    const before = { ad: blok.ad, katSayisi: blok.katSayisi };
    if (parsed.data.ad !== undefined) blok.ad = parsed.data.ad;
    if (parsed.data.katSayisi !== undefined) blok.katSayisi = parsed.data.katSayisi;
    await blok.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "blok.update",
      entityType: "Blok",
      entityId: id,
      before,
      after: { ad: blok.ad, katSayisi: blok.katSayisi },
    });

    return NextResponse.json({ id: blok.id, ad: blok.ad, katSayisi: blok.katSayisi ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { id } = await params;

    await connectDB();
    const blok = await Blok.findOne({ _id: id, siteId: session.siteId });
    if (!blok) throw new HttpError(404, "not_found");

    // Bu bloğa bağlı daire varsa silmeye izin verme
    const daireSayisi = await Daire.countDocuments({ blokId: id, siteId: session.siteId });
    if (daireSayisi > 0) throw new HttpError(409, "blok_has_daireler");

    await blok.deleteOne();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "blok.delete",
      entityType: "Blok",
      entityId: id,
      before: { ad: blok.ad },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
