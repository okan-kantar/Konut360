import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import EkOdenek from "@/models/EkOdenek";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import { requireAnyPermission } from "@/lib/auth/session";
import { errorResponse, HttpError } from "@/lib/http/errors";

interface DaireLean {
  daireNo: string;
  blokId: { ad: string } | null;
  sakinler: { adSoyad: string; aktif: boolean }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAnyPermission("aidat:manage", "aidat:tahsilat");
    const { id } = await params;
    await connectDB();

    const ekOdenek = await EkOdenek.findOne({ _id: id, siteId: session.siteId }).lean();
    if (!ekOdenek) throw new HttpError(404, "not_found");

    const borclar = await EkOdenekBorcu.find({ ekOdenekId: id, siteId: session.siteId })
      .populate<{ daireId: DaireLean }>({
        path: "daireId",
        select: "daireNo blokId sakinler",
        populate: { path: "blokId", select: "ad" },
      })
      .lean();

    return NextResponse.json({
      ekOdenek: { id: String(ekOdenek._id), ad: ekOdenek.ad, tutar: ekOdenek.tutar, sonOdemeTarihi: ekOdenek.sonOdemeTarihi },
      rows: borclar
        .filter((b) => b.daireId)
        .map((b) => {
          const daire = b.daireId as unknown as DaireLean & { blokId: { ad: string } | null };
          const sakin = daire.sakinler.find((s) => s.aktif);
          return {
            id: String(b._id),
            daireNo: daire.daireNo,
            blokAd: daire.blokId?.ad ?? "",
            sakin: sakin?.adSoyad ?? "—",
            tutar: b.tutar,
            hesaplananFaiz: b.hesaplananFaiz,
            durum: b.durum,
          };
        }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
