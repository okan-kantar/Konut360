"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SiteRow {
  id: string;
  ad: string;
  slug: string;
  aktif: boolean;
}

export default function SiteListClient({ sites }: { sites: SiteRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleAktif(site: SiteRow) {
    setPendingId(site.id);
    try {
      await fetch(`/api/sistem-admin/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !site.aktif }),
      });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (sites.length === 0) {
    return <p className="text-sm text-ink-soft">Henüz kayıtlı site yok.</p>;
  }

  return (
    <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#FAFBFD]">
            <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Site</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Slug</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Durum</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={s.id} className="border-t border-[#F0F2F7]">
              <td className="px-6 py-3.5 text-sm font-semibold">{s.ad}</td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{s.slug}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    s.aktif ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg"
                  }`}
                >
                  {s.aktif ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td className="px-6 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => toggleAktif(s)}
                  disabled={pendingId === s.id}
                  className="px-3 py-1.5 border border-card-border rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {s.aktif ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
