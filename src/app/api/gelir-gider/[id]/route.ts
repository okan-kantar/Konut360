import { NextResponse, type NextRequest } from "next/server";
import { gelirGiderSil } from "@/lib/services/gelirGiderSil";
import { requirePermission } from "@/lib/auth/session";
import { getClientIp } from "@/lib/security/rateLimit";
import { errorResponse } from "@/lib/http/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("finans:manage");
    const { id } = await params;

    await gelirGiderSil({
      siteId: session.siteId as string,
      id,
      userId: session.sub,
      rol: session.rol,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
