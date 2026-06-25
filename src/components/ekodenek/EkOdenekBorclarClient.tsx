"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BorcRow {
  id: string;
  daireNo: string;
  blokAd: string;
  sakin: string;
  tutar: number;
  hesaplananFaiz: number;
  durum: "Bekliyor" | "Gecikti" | "Odendi";
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const DURUM_STYLE: Record<BorcRow["durum"], string> = {
  Odendi: "bg-success-bg text-success-fg",
  Bekliyor: "bg-warning-bg text-warning-fg",
  Gecikti: "bg-danger-bg text-danger-fg",
};

export default function EkOdenekBorclarClient({ rows }: { rows: BorcRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeDurum(id: string, durum: BorcRow["durum"]) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ekodenek-borclari/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "kasa_required"
            ? "Ödeme işlenemedi: önce Gelir-Gider ekranından bir kasa oluşturun."
            : "Durum güncellenemedi.",
        );
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}
      <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FAFBFD]">
              <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Daire</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Sakin</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-ink-faint uppercase">Tutar</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-ink-faint uppercase">Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i === 0 ? "" : "border-t border-[#F0F2F7]"}>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 rounded-lg bg-[#EEF3FF] text-accent text-xs font-extrabold">
                    {r.blokAd}-{r.daireNo}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm font-semibold">{r.sakin}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="text-sm font-bold">{fmt.format(r.tutar)}</div>
                  {r.hesaplananFaiz > 0 && (
                    <div className="text-xs text-danger-fg font-semibold">+ {fmt.format(r.hesaplananFaiz)} faiz</div>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <select
                    value={r.durum}
                    disabled={pendingId === r.id}
                    onChange={(e) => changeDurum(r.id, e.target.value as BorcRow["durum"])}
                    className={`appearance-none border-0 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${DURUM_STYLE[r.durum]}`}
                  >
                    <option value="Odendi">● Ödendi</option>
                    <option value="Bekliyor">● Bekliyor</option>
                    <option value="Gecikti">● Gecikti</option>
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-ink-soft">
                  Bu kapsamda borçlandırılmış daire yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
