import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import User from "@/models/User";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z.object({
  tur: z.enum(["EvSahibi", "Kiraci"]),
  adSoyad: z.string().min(1).max(120),
  telefon1: z.string().max(30).optional(),
  telefon2: z.string().max(30).optional(),
  eposta: z.string().max(120).optional(),
  plaka: z.string().max(20).optional(),
  not: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ daireId: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { daireId } = await params;
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const daire = await Daire.findOne({ _id: daireId, siteId: session.siteId });
    if (!daire) throw new HttpError(404, "not_found");

    const oncekiAktif = daire.sakinler.find((s) => s.aktif)?.adSoyad ?? null;
    daire.sakinler.forEach((s) => {
      s.aktif = false;
    });
    daire.sakinler.push({
      tur: parsed.data.tur,
      adSoyad: parsed.data.adSoyad,
      telefon1: parsed.data.telefon1,
      telefon2: parsed.data.telefon2,
      eposta: parsed.data.eposta,
      plakalar: parsed.data.plaka ? [parsed.data.plaka] : [],
      not: parsed.data.not,
      aktif: true,
    } as never);
    await daire.save();

    // Eski sakinin giriş hesabı varsa pasifleştir — yeni sakin giriş bilgisi ayrıca oluşturulmalı.
    await User.updateMany({ siteId: session.siteId, daireId: daire._id, rol: "site_sakini" }, { aktif: false });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "daire.sakin_degistir",
      entityType: "Daire",
      entityId: daire.id,
      before: { aktifSakin: oncekiAktif },
      after: { aktifSakin: parsed.data.adSoyad },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
