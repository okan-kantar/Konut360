"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface BlokKart {
  id: string;
  ad: string;
  katSayisi: number | null;
  toplamDaire: number;
  dolu: number;
  borclu: number;
}

export default function BloklarClient({ bloklar }: { bloklar: BlokKart[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ad, setAd] = useState("");
  const [katSayisi, setKatSayisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bloklar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, katSayisi: katSayisi || undefined }),
      });
      if (!res.ok) {
        setError("Eklenemedi (aynı isimde blok zaten kayıtlı olabilir).");
        return;
      }
      setOpen(false);
      setAd("");
      setKatSayisi("");
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
          className="flex items-center gap-1.5 px-4 py-2.5 border border-card-border rounded-xl bg-white text-sm font-bold"
        >
          + Blok Ekle
        </button>
      </div>

      {bloklar.length === 0 ? (
        <div className="bg-white border border-card-border rounded-2xl p-10 text-center text-sm text-ink-soft">
          Henüz blok tanımlanmadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {bloklar.map((b) => (
            <div key={b.id} className="bg-white border border-card-border rounded-2xl p-5.5 shadow-sm">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
                    <rect x="5" y="3" width="10" height="14" rx="1.2" />
                    <rect x="7.4" y="6" width="2" height="2" />
                    <rect x="10.6" y="6" width="2" height="2" />
                    <rect x="7.4" y="9.6" width="2" height="2" />
                    <rect x="10.6" y="9.6" width="2" height="2" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-extrabold">{b.ad}</div>
                  {b.katSayisi != null && (
                    <div className="text-xs text-ink-faint font-semibold">{b.katSayisi} kat</div>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-bg text-sm">
                <span className="text-ink-soft">Toplam Daire</span>
                <span className="font-bold">{b.toplamDaire}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-bg text-sm">
                <span className="text-ink-soft">Dolu</span>
                <span className="font-bold">{b.dolu}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-ink-soft">Borçlu Daire</span>
                <span className="font-bold text-[#C0392B]">{b.borclu}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Yeni Blok" subtitle="Blok adı ve kat sayısını girin" onClose={() => setOpen(false)}>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Blok Adı</label>
          <input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            autoFocus
            placeholder="örn. D"
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm mb-4"
          />
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Kat Sayısı</label>
          <input
            value={katSayisi}
            onChange={(e) => setKatSayisi(e.target.value)}
            type="number"
            min="0"
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm mb-4"
          />
          {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading || !ad.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Bloğu Kaydet
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
