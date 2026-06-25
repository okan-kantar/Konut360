import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import { getGuncelTutar } from "@/lib/services/aidatGrubu";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

interface BlokLean {
  ad: string;
}
interface AidatGrubuLean {
  ad: string;
  tutarGecmisi: { tutar: number; gecerliTarih: Date }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ daireId: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { daireId } = await params;

    await connectDB();
    const daire = await Daire.findOne({ _id: daireId, siteId: session.siteId })
      .populate<{ blokId: BlokLean }>("blokId", "ad")
      .populate<{ aidatGrubuId: AidatGrubuLean }>("aidatGrubuId", "ad tutarGecmisi")
      .lean();
    if (!daire) throw new HttpError(404, "not_found");

    const aktifSakin = daire.sakinler.find((s) => s.aktif);

    return NextResponse.json({
      id: String(daire._id),
      daireNo: daire.daireNo,
      daireTipi: daire.daireTipi ?? "",
      blokAd: daire.blokId?.ad ?? "",
      aidatGrubuAd: daire.aidatGrubuId?.ad ?? "",
      guncelTutar: daire.aidatGrubuId ? getGuncelTutar(daire.aidatGrubuId) : 0,
      aktifSakin: aktifSakin
        ? {
            id: String(aktifSakin._id),
            tur: aktifSakin.tur,
            adSoyad: aktifSakin.adSoyad,
            telefon1: aktifSakin.telefon1 ?? "",
            telefon2: aktifSakin.telefon2 ?? "",
            eposta: aktifSakin.eposta ?? "",
            plakalar: aktifSakin.plakalar,
          }
        : null,
      gecmisSakinler: daire.sakinler
        .filter((s) => !s.aktif)
        .map((s) => ({ adSoyad: s.adSoyad, tur: s.tur, createdAt: s.createdAt })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const patchSchema = z.object({
  aidatGrubuId: z.string().min(1).optional(),
  daireTipi: z.string().max(60).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ daireId: string }> },
) {
  try {
    const session = await requirePermission("daire:manage");
    const { daireId } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const daire = await Daire.findOne({ _id: daireId, siteId: session.siteId });
    if (!daire) throw new HttpError(404, "not_found");

    const before: Record<string, unknown> = {};
    if (parsed.data.aidatGrubuId !== undefined) {
      before.aidatGrubuId = String(daire.aidatGrubuId);
      daire.aidatGrubuId = parsed.data.aidatGrubuId as never;
    }
    if (parsed.data.daireTipi !== undefined) {
      before.daireTipi = daire.daireTipi;
      daire.daireTipi = parsed.data.daireTipi;
    }
    await daire.save();

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "daire.update",
      entityType: "Daire",
      entityId: daireId,
      before,
      after: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
