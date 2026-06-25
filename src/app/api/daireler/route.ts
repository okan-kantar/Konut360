import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Daire, { getAktifSakin } from "@/models/Daire";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

interface BlokLean {
  _id: { toString(): string };
  ad: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("daire:manage");
    await connectDB();
    const blokId = request.nextUrl.searchParams.get("blokId");
    const filter: Record<string, unknown> = { siteId: session.siteId };
    if (blokId) filter.blokId = blokId;

    const daireler = await Daire.find(filter)
      .sort({ daireNo: 1 })
      .populate<{ blokId: BlokLean }>("blokId", "ad")
      .lean();

    return NextResponse.json({
      items: daireler.map((d) => {
        const aktifSakin = d.sakinler.find((s) => s.aktif);
        return {
          id: String(d._id),
          daireNo: d.daireNo,
          blokAd: d.blokId?.ad ?? "",
          sakin: aktifSakin
            ? {
                adSoyad: aktifSakin.adSoyad,
                tur: aktifSakin.tur,
                telefon1: aktifSakin.telefon1 ?? "",
                plaka: aktifSakin.plakalar[0] ?? "",
              }
            : null,
        };
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  blokId: z.string().min(1),
  daireNo: z.string().min(1).max(20),
  daireTipi: z.string().max(60).optional(),
  aidatGrubuId: z.string().min(1),
  sakin: z.object({
    tur: z.enum(["EvSahibi", "Kiraci"]),
    adSoyad: z.string().min(1).max(120),
    telefon1: z.string().max(30).optional(),
    eposta: z.string().max(120).optional(),
    plaka: z.string().max(20).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("daire:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    const { blokId, daireNo, daireTipi, aidatGrubuId, sakin } = parsed.data;

    await connectDB();
    const daire = await Daire.create({
      siteId: session.siteId,
      blokId,
      daireNo,
      daireTipi,
      aidatGrubuId,
      sakinler: [
        {
          tur: sakin.tur,
          adSoyad: sakin.adSoyad,
          telefon1: sakin.telefon1,
          eposta: sakin.eposta,
          plakalar: sakin.plaka ? [sakin.plaka] : [],
          aktif: true,
        },
      ],
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "daire.create",
      entityType: "Daire",
      entityId: daire.id,
      after: { daireNo: daire.daireNo, sakin: sakin.adSoyad },
    });

    return NextResponse.json(
      { id: daire.id, daireNo: daire.daireNo, sakin: getAktifSakin(daire)?.adSoyad },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
