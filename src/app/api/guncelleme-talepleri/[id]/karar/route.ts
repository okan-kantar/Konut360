import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import SakinGuncellemeTalebi from "@/models/SakinGuncellemeTalebi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z.object({ karar: z.enum(["Onayla", "Reddet"]) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const talep = await SakinGuncellemeTalebi.findOne({ _id: id, siteId: session.siteId });
    if (!talep) throw new HttpError(404, "not_found");
    if (talep.durum !== "Bekliyor") throw new HttpError(400, "zaten_karar_verildi");

    if (parsed.data.karar === "Onayla") {
      const daire = await Daire.findOne({ _id: talep.daireId, siteId: session.siteId });
      if (!daire) throw new HttpError(404, "daire_not_found");
      const sakin = daire.sakinler.find((s) => String(s._id) === String(talep.sakinSubId));
      if (sakin) {
        const alan = talep.talepEdilenAlanlar;
        if (alan.telefon1) sakin.telefon1 = alan.telefon1;
        if (alan.telefon2) sakin.telefon2 = alan.telefon2;
        if (alan.eposta) sakin.eposta = alan.eposta;
        if (alan.plaka) sakin.plakalar = [alan.plaka, ...sakin.plakalar.filter((p) => p !== alan.plaka)].slice(0, 3);
        await daire.save();
      }
      talep.durum = "Onaylandi";
    } else {
      talep.durum = "Reddedildi";
    }
    await talep.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "guncelleme_talebi.karar",
      entityType: "SakinGuncellemeTalebi",
      entityId: talep.id,
      after: { karar: parsed.data.karar },
    });

    return NextResponse.json({ ok: true, durum: talep.durum });
  } catch (error) {
    return errorResponse(error);
  }
}
