import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAidatListesi, currentDonem } from "@/lib/services/aidatListesi";
import { donemTahakkukUret } from "@/lib/services/aidatTahakkuk";
import { requireAnyPermission, requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAnyPermission("aidat:manage", "aidat:tahsilat");
    const donem = request.nextUrl.searchParams.get("donem") ?? currentDonem();
    const blokId = request.nextUrl.searchParams.get("blok");

    const sonuc = await getAidatListesi(session.siteId as string, donem, blokId);
    return NextResponse.json(sonuc);
  } catch (error) {
    return errorResponse(error);
  }
}

const tahakkukSchema = z.object({
  donem: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  vadeGunu: z.coerce.number().min(1).max(28).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("aidat:manage");
    const json = await request.json().catch(() => ({}));
    const parsed = tahakkukSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    const donem = parsed.data.donem ?? currentDonem();
    const sonuc = await donemTahakkukUret({
      siteId: session.siteId as string,
      donem,
      vadeGunu: parsed.data.vadeGunu,
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "aidat.tahakkuk_uret",
      entityType: "AidatKaydi",
      after: { donem, ...sonuc },
    });

    return NextResponse.json({ donem, ...sonuc }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
