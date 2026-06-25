import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function POST() {
  try {
    const session = await requirePermission("sakin:self");
    if (!session.daireId) throw new HttpError(400, "sakin_bilgisi_yok");

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "sakin.odeme_talimati",
      entityType: "Daire",
      entityId: session.daireId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
