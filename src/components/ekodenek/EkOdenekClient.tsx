"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface EkOdenekKart {
  id: string;
  ad: string;
  kapsam: "Tum" | "Blok" | "Secili";
  tutar: number;
  sonOdemeTarihi: string;
  faizOraniYuzde: number;
  odenen: number;
  toplam: number;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

export default function EkOdenekClient({
  ekOdenekler,
  bloklar,
}: {
  ekOdenekler: EkOdenekKart[];
  bloklar: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ad: "",
    kapsamSecimi: "Tum",
    tutar: "",
    sonOdemeTarihi: "",
    faizOraniYuzde: "5",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const isBlok = form.kapsamSecimi !== "Tum";
      const res = await fetch("/api/ekodenek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: form.ad,
          kapsam: isBlok ? "Blok" : "Tum",
          kapsamRefIds: isBlok ? [form.kapsamSecimi] : undefined,
          tutar: form.tutar,
          sonOdemeTarihi: form.sonOdemeTarihi,
          faizOraniYuzde: form.faizOraniYuzde,
        }),
      });
      if (!res.ok) {
        setError("Ek ödenek oluşturulamadı.");
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
          + Ek Ödenek Tanımla
        </button>
      </div>

      {ekOdenekler.length === 0 ? (
        <div className="bg-white border border-card-border rounded-2xl p-10 text-center text-sm text-ink-soft">
          Henüz ek ödenek tanımlanmadı.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ekOdenekler.map((e) => {
            const yuzde = e.toplam > 0 ? Math.round((e.odenen / e.toplam) * 100) : 0;
            return (
              <Link
                key={e.id}
                href={`/ekodenek/${e.id}`}
                className="bg-white border border-card-border rounded-2xl p-5.5 block hover:border-accent transition"
              >
                <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                  <div>
                    <div className="text-base font-bold">{e.ad}</div>
                    <div className="text-xs text-ink-faint font-semibold mt-0.5">
                      {e.kapsam === "Tum" ? "Tüm daireler" : "Seçili kapsam"} ({e.toplam}) · Son ödeme{" "}
                      {dateFmt(e.sonOdemeTarihi)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold">{fmt.format(e.tutar)}</div>
                    <div className="text-xs text-ink-faint font-semibold">daire başına</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#3C4660]">Tahsilat ilerlemesi</span>
                  <span className="text-ink-soft">
                    {e.odenen}/{e.toplam} daire · faiz %{e.faizOraniYuzde}
                  </span>
                </div>
                <div className="h-2 rounded bg-bg overflow-hidden">
                  <div className="h-full bg-accent rounded" style={{ width: `${yuzde}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="Ek Ödenek Tanımla" subtitle="Daireleri toplu borçlandırın" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Ödenek Adı">
              <input
                value={form.ad}
                onChange={(e) => set("ad", e.target.value)}
                placeholder="örn. Cephe Yenileme Katkı Payı"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Kapsam">
              <select
                value={form.kapsamSecimi}
                onChange={(e) => set("kapsamSecimi", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
              >
                <option value="Tum">Tüm daireler</option>
                {bloklar.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad} Blok
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex gap-4">
              <Field label="Daire Başına Tutar (₺)" className="flex-1">
                <input
                  value={form.tutar}
                  onChange={(e) => set("tutar", e.target.value)}
                  type="number"
                  min="0"
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
              <Field label="Gecikme Faizi (%)" className="flex-1">
                <input
                  value={form.faizOraniYuzde}
                  onChange={(e) => set("faizOraniYuzde", e.target.value)}
                  type="number"
                  min="0"
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
            </div>
            <Field label="Son Ödeme Tarihi">
              <input
                value={form.sonOdemeTarihi}
                onChange={(e) => set("sonOdemeTarihi", e.target.value)}
                type="date"
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
              disabled={loading || !form.ad.trim() || !form.tutar || !form.sonOdemeTarihi}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Ödeneği Oluştur
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
