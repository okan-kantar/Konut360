import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import AidatGrubu from "@/models/AidatGrubu";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await requirePermission("tanim:manage");
    await connectDB();
    const gruplar = await AidatGrubu.find({ siteId: session.siteId }).sort({ ad: 1 }).lean();
    return NextResponse.json({
      items: gruplar.map((g) => ({
        id: String(g._id),
        ad: g.ad,
        guncelTutar: getGuncelTutar(g),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  ad: z.string().min(1).max(120),
  tutar: z.coerce.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("tanim:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const grup = await AidatGrubu.create({
      siteId: session.siteId,
      ad: parsed.data.ad,
      tutarGecmisi: [{ tutar: parsed.data.tutar, gecerliTarih: new Date() }],
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "aidat_grubu.create",
      entityType: "AidatGrubu",
      entityId: grup.id,
      after: { ad: grup.ad, tutar: parsed.data.tutar },
    });

    return NextResponse.json(
      { id: grup.id, ad: grup.ad, guncelTutar: parsed.data.tutar },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
