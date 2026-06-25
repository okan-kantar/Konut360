import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z.object({
  kullaniciAdi: z.string().min(3).max(100),
  sifre: z.string().min(6).max(200),
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
    const aktifSakin = daire.sakinler.find((s) => s.aktif);
    if (!aktifSakin) throw new HttpError(400, "aktif_sakin_yok");

    const sifreHash = await hashPassword(parsed.data.sifre);
    const existing = await User.findOne({ siteId: session.siteId, daireId: daire._id, rol: "site_sakini" });

    if (existing) {
      existing.kullaniciAdi = parsed.data.kullaniciAdi.toLowerCase();
      existing.sifreHash = sifreHash;
      existing.sakinSubId = aktifSakin._id;
      existing.adSoyad = aktifSakin.adSoyad;
      existing.aktif = true;
      await existing.save();
    } else {
      await User.create({
        siteId: session.siteId,
        daireId: daire._id,
        sakinSubId: aktifSakin._id,
        kullaniciAdi: parsed.data.kullaniciAdi.toLowerCase(),
        sifreHash,
        rol: "site_sakini",
        adSoyad: aktifSakin.adSoyad,
      });
    }

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "sakin.giris_olustur",
      entityType: "Daire",
      entityId: daire.id,
      after: { kullaniciAdi: parsed.data.kullaniciAdi },
    });

    return NextResponse.json({ ok: true, kullaniciAdi: parsed.data.kullaniciAdi.toLowerCase() });
  } catch (error) {
    return errorResponse(error);
  }
}
