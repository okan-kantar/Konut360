import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Firma from "@/models/Firma";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await requirePermission("firma:manage");
    await connectDB();
    const firmalar = await Firma.find({ siteId: session.siteId }).sort({ ad: 1 }).lean();
    return NextResponse.json({
      items: firmalar.map((f) => ({
        id: String(f._id),
        ad: f.ad,
        tur: f.tur,
        hizmet: f.hizmet ?? "",
        yetkili: f.yetkili ?? "",
        vergiNoTckn: f.vergiNoTckn ?? "",
        vergiDairesi: f.vergiDairesi ?? "",
        iban: f.iban ?? "",
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  ad: z.string().min(1).max(150),
  tur: z.enum(["GercekKisi", "TuzelKisi"]),
  hizmet: z.string().max(80).optional(),
  yetkili: z.string().max(120).optional(),
  vergiDairesi: z.string().max(120).optional(),
  vergiNoTckn: z.string().max(40).optional(),
  iban: z.string().max(40).optional(),
  adres: z.string().max(300).optional(),
  iletisim: z.string().max(120).optional(),
  ekIrtibat: z.string().max(120).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("firma:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const firma = await Firma.create({ siteId: session.siteId, ...parsed.data });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "firma.create",
      entityType: "Firma",
      entityId: firma.id,
      after: { ad: firma.ad, tur: firma.tur },
    });

    return NextResponse.json({ id: firma.id, ad: firma.ad }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
