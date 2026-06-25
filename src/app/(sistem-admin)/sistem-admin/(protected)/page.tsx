import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import Site from "@/models/Site";
import SiteListClient from "@/components/sistem-admin/SiteListClient";

export default async function SistemAdminPage() {
  await connectDB();
  const sites = await Site.find().sort({ createdAt: -1 }).lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold tracking-tight">Siteler</h1>
        <Link
          href="/sistem-admin/yeni"
          className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold"
        >
          + Yeni Site
        </Link>
      </div>
      <SiteListClient
        sites={sites.map((s) => ({
          id: String(s._id),
          ad: s.ad,
          slug: s.slug,
          aktif: s.aktif,
        }))}
      />
    </div>
  );
}
