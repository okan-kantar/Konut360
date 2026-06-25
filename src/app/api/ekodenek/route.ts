import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import EkOdenek from "@/models/EkOdenek";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import { ekOdenekOlustur } from "@/lib/services/ekOdenekOlustur";
import { requireAnyPermission, requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await requireAnyPermission("aidat:manage", "aidat:tahsilat");
    const siteId = session.siteId as string;
    await senkronizeGecikenDurumlar(siteId);
    await connectDB();

    const [ekOdenekler, borclar] = await Promise.all([
      EkOdenek.find({ siteId }).sort({ createdAt: -1 }).lean(),
      EkOdenekBorcu.find({ siteId }).select("ekOdenekId durum").lean(),
    ]);

    const items = ekOdenekler.map((e) => {
      const ds = borclar.filter((b) => String(b.ekOdenekId) === String(e._id));
      const odenen = ds.filter((b) => b.durum === "Odendi").length;
      return {
        id: String(e._id),
        ad: e.ad,
        kapsam: e.kapsam,
        tutar: e.tutar,
        sonOdemeTarihi: e.sonOdemeTarihi,
        faizOraniYuzde: e.faizOraniYuzde,
        odenen,
        toplam: ds.length,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  ad: z.string().min(1).max(150),
  kapsam: z.enum(["Tum", "Blok", "Secili"]),
  kapsamRefIds: z.array(z.string()).optional(),
  tutar: z.coerce.number().min(0),
  sonOdemeTarihi: z.string().min(1),
  faizOraniYuzde: z.coerce.number().min(0).max(100).default(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("aidat:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    const data = parsed.data;
    if (data.kapsam !== "Tum" && (!data.kapsamRefIds || data.kapsamRefIds.length === 0)) {
      throw new HttpError(400, "kapsam_secimi_gerekli");
    }

    const { ekOdenek, daireSayisi } = await ekOdenekOlustur({
      siteId: session.siteId as string,
      ad: data.ad,
      kapsam: data.kapsam,
      kapsamRefIds: data.kapsamRefIds ?? [],
      tutar: data.tutar,
      sonOdemeTarihi: new Date(data.sonOdemeTarihi),
      faizOraniYuzde: data.faizOraniYuzde,
    });

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "ekodenek.create",
      entityType: "EkOdenek",
      entityId: ekOdenek.id,
      after: { ad: ekOdenek.ad, kapsam: ekOdenek.kapsam, daireSayisi },
    });

    return NextResponse.json({ id: ekOdenek.id, ad: ekOdenek.ad, daireSayisi }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
