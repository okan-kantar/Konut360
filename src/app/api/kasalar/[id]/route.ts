import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Kasa from "@/models/Kasa";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const patchSchema = z.object({
  ad: z.string().min(1).max(80).optional(),
  tip: z.string().min(1).max(40).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("finans:manage");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const kasa = await Kasa.findOne({ _id: id, siteId: session.siteId });
    if (!kasa) throw new HttpError(404, "not_found");

    const before = { ad: kasa.ad, tip: kasa.tip };
    if (parsed.data.ad !== undefined) kasa.ad = parsed.data.ad;
    if (parsed.data.tip !== undefined) kasa.tip = parsed.data.tip;
    await kasa.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "kasa.update",
      entityType: "Kasa",
      entityId: id,
      before,
      after: { ad: kasa.ad, tip: kasa.tip },
    });

    return NextResponse.json({ id: kasa.id, ad: kasa.ad, tip: kasa.tip });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("finans:manage");
    const { id } = await params;

    await connectDB();
    const kasa = await Kasa.findOne({ _id: id, siteId: session.siteId });
    if (!kasa) throw new HttpError(404, "not_found");

    // İşlem kaydı olan kasa silinemez
    const kayitSayisi = await GelirGiderKaydi.countDocuments({ kasaId: id, siteId: session.siteId });
    if (kayitSayisi > 0) throw new HttpError(409, "kasa_has_kayitlar");

    await kasa.deleteOne();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "kasa.delete",
      entityType: "Kasa",
      entityId: id,
      before: { ad: kasa.ad, tip: kasa.tip },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
