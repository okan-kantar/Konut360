import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import TanimListesi from "@/models/TanimListesi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("tanim:manage");
    const { id } = await params;

    await connectDB();
    const item = await TanimListesi.findOneAndDelete({ _id: id, siteId: session.siteId });
    if (!item) throw new HttpError(404, "not_found");

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "tanim.delete",
      entityType: "TanimListesi",
      entityId: id,
      before: { kategori: item.kategori, deger: item.deger },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
