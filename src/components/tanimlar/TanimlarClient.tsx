"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import type { TanimKategori } from "@/models/TanimListesi";

interface KategoriCard {
  kategori: TanimKategori;
  label: string;
  items: { id: string; deger: string }[];
}

interface AidatGrubuItem {
  id: string;
  ad: string;
  guncelTutar: number;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default function TanimlarClient({
  kategoriler,
  aidatGruplari,
}: {
  kategoriler: KategoriCard[];
  aidatGruplari: AidatGrubuItem[];
}) {
  const router = useRouter();
  const [openKategori, setOpenKategori] = useState<TanimKategori | null>(null);
  const [openAidatGrubu, setOpenAidatGrubu] = useState(false);
  const [value, setValue] = useState("");
  const [tutar, setTutar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeAll() {
    setOpenKategori(null);
    setOpenAidatGrubu(false);
    setValue("");
    setTutar("");
    setError(null);
  }

  async function submitTanim(kategori: TanimKategori) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tanimlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori, deger: value }),
      });
      if (!res.ok) {
        setError("Eklenemedi (aynı değer zaten kayıtlı olabilir).");
        return;
      }
      closeAll();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitAidatGrubu() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aidat-gruplari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: value, tutar }),
      });
      if (!res.ok) {
        setError("Eklenemedi (aynı isimde grup zaten kayıtlı olabilir).");
        return;
      }
      closeAll();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
      {kategoriler.map((k) => (
        <div key={k.kategori} className="bg-white border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-sm font-bold">{k.label}</div>
            <button
              type="button"
              onClick={() => {
                closeAll();
                setOpenKategori(k.kategori);
              }}
              className="w-6.5 h-6.5 border border-card-border rounded-lg text-accent font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {k.items.length === 0 && <span className="text-xs text-ink-faint">Henüz değer yok</span>}
            {k.items.map((it) => (
              <span
                key={it.id}
                className="text-xs font-semibold text-[#3C4660] bg-bg border border-card-border px-2.5 py-1 rounded-lg"
              >
                {it.deger}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-sm font-bold">Aidat Grupları</div>
          <button
            type="button"
            onClick={() => {
              closeAll();
              setOpenAidatGrubu(true);
            }}
            className="w-6.5 h-6.5 border border-card-border rounded-lg text-accent font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {aidatGruplari.length === 0 && <span className="text-xs text-ink-faint">Henüz grup yok</span>}
          {aidatGruplari.map((g) => (
            <span
              key={g.id}
              className="text-xs font-semibold text-[#3C4660] bg-bg border border-card-border px-2.5 py-1 rounded-lg"
            >
              {g.ad} — {fmt.format(g.guncelTutar)}
            </span>
          ))}
        </div>
      </div>

      {openKategori && (
        <Modal
          title={`${kategoriler.find((k) => k.kategori === openKategori)?.label} — Yeni Kayıt`}
          subtitle="Parametrik listeye değer ekleyin"
          onClose={closeAll}
        >
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Değer</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm mb-4"
          />
          {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={closeAll} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => submitTanim(openKategori)}
              disabled={loading || !value.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Ekle
            </button>
          </div>
        </Modal>
      )}

      {openAidatGrubu && (
        <Modal title="Aidat Grubu — Yeni Kayıt" subtitle="Grup adı ve başlangıç tutarını girin" onClose={closeAll}>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Grup Adı</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm mb-4"
          />
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Tutar (₺)</label>
          <input
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            type="number"
            min="0"
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm mb-4"
          />
          {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={closeAll} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submitAidatGrubu}
              disabled={loading || !value.trim() || !tutar}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Ekle
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
