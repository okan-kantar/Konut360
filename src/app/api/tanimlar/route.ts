import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import TanimListesi, { type TanimKategori } from "@/models/TanimListesi";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("tanim:manage");
    await connectDB();
    const kategori = request.nextUrl.searchParams.get("kategori") as TanimKategori | null;
    const filter: Record<string, unknown> = { siteId: session.siteId };
    if (kategori) filter.kategori = kategori;

    const items = await TanimListesi.find(filter).sort({ deger: 1 }).lean();
    return NextResponse.json({
      items: items.map((i) => ({ id: String(i._id), kategori: i.kategori, deger: i.deger })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  kategori: z.enum(["DaireTipi", "GelirTuru", "GiderTuru", "OdemeYontemi"]),
  deger: z.string().min(1).max(120),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("tanim:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");

    await connectDB();
    const item = await TanimListesi.create({ siteId: session.siteId, ...parsed.data });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "tanim.create",
      entityType: "TanimListesi",
      entityId: item.id,
      after: { kategori: item.kategori, deger: item.deger },
    });

    return NextResponse.json({ id: item.id, kategori: item.kategori, deger: item.deger }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
