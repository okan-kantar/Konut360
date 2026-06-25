import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import EkOdenek from "@/models/EkOdenek";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import { requirePageSession } from "@/lib/auth/session";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import EkOdenekBorclarClient from "@/components/ekodenek/EkOdenekBorclarClient";

interface DaireLean {
  daireNo: string;
  blokId: { ad: string } | null;
  sakinler: { adSoyad: string; aktif: boolean }[];
}

export default async function EkOdenekDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const { id } = await params;
  const siteId = session.siteId as string;

  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const ekOdenek = await EkOdenek.findOne({ _id: id, siteId }).lean();
  if (!ekOdenek) notFound();

  const borclar = await EkOdenekBorcu.find({ ekOdenekId: id, siteId })
    .populate<{ daireId: DaireLean }>({
      path: "daireId",
      select: "daireNo blokId sakinler",
      populate: { path: "blokId", select: "ad" },
    })
    .lean();

  const rows = borclar
    .filter((b) => b.daireId)
    .map((b) => {
      const daire = b.daireId as unknown as DaireLean;
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
    });

  return (
    <div>
      <Link href="/ekodenek" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft mb-4">
        ← Ek ödenek listesine dön
      </Link>
      <h1 className="text-lg font-extrabold tracking-tight mb-1">{ekOdenek.ad}</h1>
      <p className="text-sm text-ink-faint mb-5">{rows.length} daire borçlandırıldı</p>
      <EkOdenekBorclarClient rows={rows} />
    </div>
  );
}
