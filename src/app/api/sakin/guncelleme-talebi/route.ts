import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import SakinGuncellemeTalebi from "@/models/SakinGuncellemeTalebi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z
  .object({
    telefon1: z.string().max(30).optional(),
    telefon2: z.string().max(30).optional(),
    eposta: z.string().max(120).optional(),
    plaka: z.string().max(20).optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined && v !== ""),
    { message: "En az bir alan dolu olmalı" },
  );

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("sakin:self");
    if (!session.daireId || !session.sakinSubId) throw new HttpError(400, "sakin_bilgisi_yok");
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const talep = await SakinGuncellemeTalebi.create({
      siteId: session.siteId,
      daireId: session.daireId,
      sakinSubId: session.sakinSubId,
      talepEdilenAlanlar: parsed.data,
      durum: "Bekliyor",
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "sakin.guncelleme_talebi",
      entityType: "SakinGuncellemeTalebi",
      entityId: talep.id,
      after: parsed.data,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
