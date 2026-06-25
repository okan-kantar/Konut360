import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Kasa from "@/models/Kasa";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await requirePermission("finans:manage");
    await connectDB();
    const kasalar = await Kasa.find({ siteId: session.siteId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      items: kasalar.map((k) => ({
        id: String(k._id),
        ad: k.ad,
        tip: k.tip,
        acilisBakiyesi: k.acilisBakiyesi,
        guncelBakiye: k.guncelBakiye,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  ad: z.string().min(1).max(80),
  tip: z.string().min(1).max(40),
  acilisBakiyesi: z.coerce.number().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("finans:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const kasa = await Kasa.create({
      siteId: session.siteId,
      ad: parsed.data.ad,
      tip: parsed.data.tip,
      acilisBakiyesi: parsed.data.acilisBakiyesi,
      guncelBakiye: parsed.data.acilisBakiyesi,
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "kasa.create",
      entityType: "Kasa",
      entityId: kasa.id,
      after: { ad: kasa.ad, tip: kasa.tip, acilisBakiyesi: kasa.acilisBakiyesi },
    });

    return NextResponse.json(
      { id: kasa.id, ad: kasa.ad, tip: kasa.tip, acilisBakiyesi: kasa.acilisBakiyesi, guncelBakiye: kasa.guncelBakiye },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
