import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Blok from "@/models/Blok";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await requirePermission("daire:manage");
    await connectDB();
    const bloklar = await Blok.find({ siteId: session.siteId }).sort({ ad: 1 }).lean();
    return NextResponse.json({
      items: bloklar.map((b) => ({ id: String(b._id), ad: b.ad, katSayisi: b.katSayisi ?? null })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  ad: z.string().min(1).max(60),
  katSayisi: z.coerce.number().min(0).max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("daire:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const blok = await Blok.create({ siteId: session.siteId, ...parsed.data });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "blok.create",
      entityType: "Blok",
      entityId: blok.id,
      after: { ad: blok.ad, katSayisi: blok.katSayisi },
    });

    return NextResponse.json({ id: blok.id, ad: blok.ad, katSayisi: blok.katSayisi ?? null }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
