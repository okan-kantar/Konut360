import { connectDB } from "@/lib/db/connect";
import Site from "@/models/Site";
import GirisForm from "@/components/auth/GirisForm";

// Site listesi canlı veridir (Süper Admin yeni site ekleyebilir) — statik
// build-time önbellekleme yapılmamalı.
export const dynamic = "force-dynamic";

export default async function GirisPage() {
  await connectDB();
  const sites = await Site.find({ aktif: true }).sort({ ad: 1 }).lean();
  const siteOptions = sites.map((s) => ({ slug: s.slug, ad: s.ad }));

  return <GirisForm sites={siteOptions} />;
}
