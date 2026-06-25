"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface Option {
  id: string;
  ad: string;
}

export default function DaireEkleButton({
  bloklar,
  aidatGruplari,
}: {
  bloklar: Option[];
  aidatGruplari: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    blokId: bloklar[0]?.id ?? "",
    daireNo: "",
    daireTipi: "",
    aidatGrubuId: aidatGruplari[0]?.id ?? "",
    tur: "EvSahibi" as "EvSahibi" | "Kiraci",
    adSoyad: "",
    telefon1: "",
    plaka: "",
    eposta: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/daireler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blokId: form.blokId,
          daireNo: form.daireNo,
          daireTipi: form.daireTipi || undefined,
          aidatGrubuId: form.aidatGrubuId,
          sakin: {
            tur: form.tur,
            adSoyad: form.adSoyad,
            telefon1: form.telefon1 || undefined,
            eposta: form.eposta || undefined,
            plaka: form.plaka || undefined,
          },
        }),
      });
      if (!res.ok) {
        setError("Daire kaydedilemedi (bu daire no zaten kayıtlı olabilir).");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (bloklar.length === 0 || aidatGruplari.length === 0) {
    return (
      <p className="text-xs text-ink-faint max-w-xs text-right">
        Daire eklemek için önce Bloklar ve Tanımlar &gt; Aidat Grupları ekranlarından en az bir
        kayıt oluşturun.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 border border-card-border rounded-xl bg-white text-sm font-bold"
      >
        + Daire Ekle
      </button>

      {open && (
        <Modal title="Yeni Daire & Sakin" subtitle="Daire kaydı ve sakin bilgilerini girin" onClose={() => setOpen(false)}>
          <div className="flex flex-wrap gap-4">
            <Field label="Blok" className="w-[calc(50%-8px)]">
              <select
                value={form.blokId}
                onChange={(e) => set("blokId", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
              >
                {bloklar.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Daire No" className="w-[calc(50%-8px)]">
              <input
                value={form.daireNo}
                onChange={(e) => set("daireNo", e.target.value)}
                placeholder="örn. 14"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Sakin Adı Soyadı" className="w-full">
              <input
                value={form.adSoyad}
                onChange={(e) => set("adSoyad", e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Sakin Türü" className="w-[calc(50%-8px)]">
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
            <Field label="Aidat Grubu" className="w-[calc(50%-8px)]">
              <select
                value={form.aidatGrubuId}
                onChange={(e) => set("aidatGrubuId", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
              >
                {aidatGruplari.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.ad}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Telefon" className="w-[calc(50%-8px)]">
              <input
                value={form.telefon1}
                onChange={(e) => set("telefon1", e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Araç Plakası" className="w-[calc(50%-8px)]">
              <input
                value={form.plaka}
                onChange={(e) => set("plaka", e.target.value)}
                placeholder="34 ABC 123"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="E-posta" className="w-full">
              <input
                value={form.eposta}
                onChange={(e) => set("eposta", e.target.value)}
                placeholder="ornek@gmail.com"
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
              disabled={loading || !form.daireNo.trim() || !form.adSoyad.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Daireyi Kaydet
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
