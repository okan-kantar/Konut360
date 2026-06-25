"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function SakinDegistirButton({ daireId }: { daireId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tur: "Kiraci" as "EvSahibi" | "Kiraci",
    adSoyad: "",
    telefon1: "",
    plaka: "",
    eposta: "",
    not: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daireler/${daireId}/sakinler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tur: form.tur,
          adSoyad: form.adSoyad,
          telefon1: form.telefon1 || undefined,
          eposta: form.eposta || undefined,
          plaka: form.plaka || undefined,
          not: form.not || undefined,
        }),
      });
      if (!res.ok) {
        setError("Kaydedilemedi.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 border border-card-border rounded-xl bg-white text-sm font-bold"
      >
        Sakin Değiştir / Ekle
      </button>

      {open && (
        <Modal
          title="Sakin Değiştir / Ekle"
          subtitle="Yeni sakin kaydı eklenir, önceki aktif sakin geçmişe taşınır"
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-wrap gap-4">
            <Field label="Sakin Türü" className="w-full">
              <div className="flex gap-2 bg-[#EFF2F7] p-1 rounded-xl">
                {(["EvSahibi", "Kiraci"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("tur", t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                      form.tur === t ? "bg-white shadow-sm text-ink" : "text-ink-soft"
                    }`}
                  >
                    {t === "EvSahibi" ? "Ev Sahibi" : "Kiracı"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Sakin Adı Soyadı" className="w-full">
              <input
                value={form.adSoyad}
                onChange={(e) => set("adSoyad", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Telefon" className="w-[calc(50%-8px)]">
              <input
                value={form.telefon1}
                onChange={(e) => set("telefon1", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Araç Plakası" className="w-[calc(50%-8px)]">
              <input
                value={form.plaka}
                onChange={(e) => set("plaka", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="E-posta" className="w-full">
              <input
                value={form.eposta}
                onChange={(e) => set("eposta", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Not" className="w-full">
              <textarea
                value={form.not}
                onChange={(e) => set("not", e.target.value)}
                rows={2}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm resize-vertical"
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
              disabled={loading || !form.adSoyad.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Kaydet
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-[#3C4660] mb-2">{label}</label>
      {children}
    </div>
  );
}
