import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Site from "@/models/Site";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { getClientIp } from "@/lib/security/rateLimit";

export async function GET() {
  try {
    await requireRole("sistem_admin");
    await connectDB();
    const sites = await Site.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      sites: sites.map((s) => ({
        id: String(s._id),
        ad: s.ad,
        slug: s.slug,
        aktif: s.aktif,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  ad: z.string().min(2).max(120),
  yoneticiAdSoyad: z.string().min(2).max(120),
  yoneticiKullaniciAdi: z.string().min(3).max(100),
  yoneticiSifre: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("sistem_admin");
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    const { ad, yoneticiAdSoyad, yoneticiKullaniciAdi, yoneticiSifre } = parsed.data;

    await connectDB();
    const baseSlug = slugify(ad) || "site";
    let slug = baseSlug;
    let suffix = 1;
    while (await Site.exists({ slug })) {
      slug = `${baseSlug}-${++suffix}`;
    }

    const site = await Site.create({ ad, slug });
    const sifreHash = await hashPassword(yoneticiSifre);
    const yonetici = await User.create({
      siteId: site._id,
      kullaniciAdi: yoneticiKullaniciAdi.toLowerCase(),
      sifreHash,
      rol: "site_yoneticisi",
      adSoyad: yoneticiAdSoyad,
    });

    await logAction({
      siteId: site.id,
      userId: session.sub,
      rol: session.rol,
      action: "site.create",
      entityType: "Site",
      entityId: site.id,
      after: { ad: site.ad, slug: site.slug, yoneticiKullaniciAdi: yonetici.kullaniciAdi },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json(
      { id: site.id, ad: site.ad, slug: site.slug, aktif: site.aktif },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
