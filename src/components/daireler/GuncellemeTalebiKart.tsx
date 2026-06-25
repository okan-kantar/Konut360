"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuncellemeTalebiKart({
  talepId,
  alanlar,
}: {
  talepId: string;
  alanlar: { telefon1?: string; telefon2?: string; eposta?: string; plaka?: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function karar(karar: "Onayla" | "Reddet") {
    setLoading(true);
    try {
      await fetch(`/api/guncelleme-talepleri/${talepId}/karar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ karar }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-warning-bg border border-warning-fg/20 rounded-2xl p-5.5">
      <div className="text-sm font-bold text-warning-fg mb-3">Bekleyen İletişim Güncelleme Talebi</div>
      <div className="flex flex-col gap-1.5 text-sm mb-4">
        {alanlar.telefon1 && (
          <div>
            <span className="text-ink-soft">Telefon: </span>
            <span className="font-bold">{alanlar.telefon1}</span>
          </div>
        )}
        {alanlar.eposta && (
          <div>
            <span className="text-ink-soft">E-posta: </span>
            <span className="font-bold">{alanlar.eposta}</span>
          </div>
        )}
        {alanlar.plaka && (
          <div>
            <span className="text-ink-soft">Plaka: </span>
            <span className="font-bold">{alanlar.plaka}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => karar("Onayla")}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold disabled:opacity-60"
        >
          Onayla
        </button>
        <button
          type="button"
          onClick={() => karar("Reddet")}
          disabled={loading}
          className="px-4 py-2 border border-card-border bg-white rounded-lg text-xs font-bold disabled:opacity-60"
        >
          Reddet
        </button>
      </div>
    </div>
  );
}
