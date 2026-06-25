import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Site from "@/models/Site";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { getClientIp } from "@/lib/security/rateLimit";

const patchSchema = z.object({ aktif: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const session = await requireRole("sistem_admin");
    const { siteId } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const site = await Site.findById(siteId);
    if (!site) throw new HttpError(404, "not_found");
    const before = { aktif: site.aktif };
    site.aktif = parsed.data.aktif;
    await site.save();

    await logAction({
      siteId: site.id,
      userId: session.sub,
      rol: session.rol,
      action: "site.toggle_active",
      entityType: "Site",
      entityId: site.id,
      before,
      after: { aktif: site.aktif },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ id: site.id, aktif: site.aktif });
  } catch (error) {
    return errorResponse(error);
  }
}
