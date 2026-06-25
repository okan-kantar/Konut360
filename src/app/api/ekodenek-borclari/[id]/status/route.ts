import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { changeEkOdenekBorcuStatus } from "@/lib/services/changeEkOdenekBorcuStatus";
import { resolveDefaultKasaId } from "@/lib/services/kasaBakiye";
import { requireAnyPermission } from "@/lib/auth/session";
import { getClientIp } from "@/lib/security/rateLimit";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z.object({
  durum: z.enum(["Bekliyor", "Gecikti", "Odendi"]),
  kasaId: z.string().optional(),
  odemeYontemi: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAnyPermission("aidat:manage", "aidat:tahsilat");
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    let kasaId = parsed.data.kasaId;
    if (parsed.data.durum === "Odendi" && !kasaId) {
      kasaId = (await resolveDefaultKasaId(session.siteId as string)) ?? undefined;
      if (!kasaId) throw new HttpError(400, "kasa_required");
    }

    const borc = await changeEkOdenekBorcuStatus({
      siteId: session.siteId as string,
      borcId: id,
      yeniDurum: parsed.data.durum,
      kasaId,
      odemeYontemi: parsed.data.odemeYontemi,
      userId: session.sub,
      rol: session.rol,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ id: String(borc._id), durum: borc.durum });
  } catch (error) {
    return errorResponse(error);
  }
}
