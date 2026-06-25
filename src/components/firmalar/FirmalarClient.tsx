"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface Firma {
  id: string;
  ad: string;
  tur: "GercekKisi" | "TuzelKisi";
  hizmet: string;
  yetkili: string;
  vergiNoTckn: string;
  iban: string;
}

export default function FirmalarClient({
  firmalar,
  hizmetSecenekleri,
}: {
  firmalar: Firma[];
  hizmetSecenekleri: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ad: "",
    tur: "TuzelKisi" as "GercekKisi" | "TuzelKisi",
    hizmet: hizmetSecenekleri[0] ?? "",
    yetkili: "",
    vergiNoTckn: "",
    iban: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/firmalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("Firma kaydedilemedi.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold"
        >
          + Firma Ekle
        </button>
      </div>

      <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FAFBFD]">
              <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Firma</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Tür</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Hizmet</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Yetkili</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Vergi/TCKN</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">IBAN</th>
            </tr>
          </thead>
          <tbody>
            {firmalar.map((f, i) => (
              <tr key={f.id} className={i === 0 ? "" : "border-t border-[#F0F2F7]"}>
                <td className="px-6 py-3.5 text-sm font-bold">{f.ad}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      f.tur === "TuzelKisi" ? "bg-[#EEF3FF] text-accent" : "bg-[#FBF1E7] text-[#B7791F]"
                    }`}
                  >
                    {f.tur === "TuzelKisi" ? "Tüzel Kişi" : "Gerçek Kişi"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{f.hizmet || "—"}</td>
                <td className="px-4 py-3.5 text-sm font-semibold">{f.yetkili || "—"}</td>
                <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{f.vergiNoTckn || "—"}</td>
                <td className="px-6 py-3.5 text-xs text-ink-soft font-semibold">{f.iban || "—"}</td>
              </tr>
            ))}
            {firmalar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-soft">
                  Henüz firma kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Yeni Firma" subtitle="Tedarikçi / hizmet firma kaydı" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Firma / Kişi Adı">
              <input
                value={form.ad}
                onChange={(e) => set("ad", e.target.value)}
                placeholder="Firma ünvanı"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <div className="flex gap-4">
              <Field label="Tür" className="flex-1">
                <div className="flex gap-2 bg-[#EFF2F7] p-1 rounded-xl">
                  {(["TuzelKisi", "GercekKisi"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tur", t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${form.tur === t ? "bg-white shadow-sm text-ink" : "text-ink-soft"}`}
                    >
                      {t === "TuzelKisi" ? "Tüzel Kişi" : "Gerçek Kişi"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Hizmet" className="flex-1">
                <select
                  value={form.hizmet}
                  onChange={(e) => set("hizmet", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
                >
                  {hizmetSecenekleri.length === 0 && <option value="">—</option>}
                  {hizmetSecenekleri.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex gap-4">
              <Field label="Yetkili" className="flex-1">
                <input
                  value={form.yetkili}
                  onChange={(e) => set("yetkili", e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
              <Field label="Vergi No / TCKN" className="flex-1">
                <input
                  value={form.vergiNoTckn}
                  onChange={(e) => set("vergiNoTckn", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
            </div>
            <Field label="IBAN">
              <input
                value={form.iban}
                onChange={(e) => set("iban", e.target.value)}
                placeholder="TR.."
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-[#C0392B] mt-4">{error}</p>}
          <div className="flex justify-end gap-2.5 mt-5">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading || !form.ad.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Firmayı Kaydet
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-[#3C4660] mb-2">{label}</label>
      {children}
    </div>
  );
}
