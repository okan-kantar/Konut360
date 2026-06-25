import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import GelirGiderKaydi from "@/models/GelirGiderKaydi";
import { gelirGiderEkle } from "@/lib/services/gelirGiderEkle";
import { requirePermission } from "@/lib/auth/session";
import { getClientIp } from "@/lib/security/rateLimit";
import { errorResponse, HttpError } from "@/lib/http/errors";

interface KasaLean {
  ad: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("finans:manage");
    const { searchParams } = request.nextUrl;
    const sayfa = Math.max(1, Number(searchParams.get("sayfa") ?? "1"));
    const limitParam = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "50")));
    const kasaId = searchParams.get("kasaId");
    const tip = searchParams.get("tip"); // "Gelir" | "Gider"
    const baslangic = searchParams.get("baslangic"); // ISO date
    const bitis = searchParams.get("bitis"); // ISO date

    await connectDB();
    const filter: Record<string, unknown> = { siteId: session.siteId };
    if (kasaId) filter.kasaId = kasaId;
    if (tip === "Gelir" || tip === "Gider") filter.tip = tip;
    if (baslangic || bitis) {
      const tarihFilter: Record<string, Date> = {};
      if (baslangic) tarihFilter.$gte = new Date(baslangic);
      if (bitis) tarihFilter.$lte = new Date(bitis);
      filter.tarih = tarihFilter;
    }

    const [toplam, kayitlar] = await Promise.all([
      GelirGiderKaydi.countDocuments(filter),
      GelirGiderKaydi.find(filter)
        .sort({ tarih: -1, createdAt: -1 })
        .skip((sayfa - 1) * limitParam)
        .limit(limitParam)
        .populate<{ kasaId: KasaLean }>("kasaId", "ad")
        .lean(),
    ]);

    return NextResponse.json({
      items: kayitlar.map((k) => ({
        id: String(k._id),
        tarih: k.tarih,
        aciklama: k.aciklama ?? "",
        kategori: k.kategori,
        kasaAd: k.kasaId?.ad ?? "",
        tip: k.tip,
        tutar: k.tutar,
        kaynak: k.kaynak,
      })),
      toplam,
      sayfa,
      sayfaSayisi: Math.ceil(toplam / limitParam),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  kasaId: z.string().min(1),
  tip: z.enum(["Gelir", "Gider"]),
  kategori: z.string().min(1).max(80),
  tutar: z.coerce.number().positive(),
  tarih: z.string().min(1),
  odemeYontemi: z.string().min(1).max(40),
  aciklama: z.string().max(500).optional(),
  firmaId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("finans:manage");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    const data = parsed.data;

    const kayit = await gelirGiderEkle({
      siteId: session.siteId as string,
      kasaId: data.kasaId,
      tip: data.tip,
      kategori: data.kategori,
      tutar: data.tutar,
      tarih: new Date(data.tarih),
      odemeYontemi: data.odemeYontemi,
      aciklama: data.aciklama,
      firmaId: data.firmaId,
      userId: session.sub,
      rol: session.rol,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ id: String(kayit._id) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
