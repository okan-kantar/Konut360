"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Row {
  id: string;
  daireNo: string;
  blokId: string | null;
  blokAd: string;
  sakin: string;
  aidatGrubuAd: string;
  tutar: number;
  faiz: number;
  durum: "Bekliyor" | "Gecikti" | "Odendi";
}

interface Kpi {
  tahsilEdilen: number;
  bekleyen: number;
  gecikmis: number;
  odendiSayisi: number;
  bekliyorSayisi: number;
  geciktiSayisi: number;
  toplam: number;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const DURUM_STYLE: Record<Row["durum"], string> = {
  Odendi: "bg-success-bg text-success-fg",
  Bekliyor: "bg-warning-bg text-warning-fg",
  Gecikti: "bg-danger-bg text-danger-fg",
};

const DURUM_LABEL: Record<Row["durum"], string> = {
  Odendi: "● Ödendi",
  Bekliyor: "● Bekliyor",
  Gecikti: "● Gecikti",
};

export default function AidatClient({
  donem,
  bloklar,
  aktifBlok,
  rows,
  kpi,
  canManage,
}: {
  donem: string;
  bloklar: { id: string; ad: string }[];
  aktifBlok: string | null;
  rows: Row[];
  kpi: Kpi;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tahakkukLoading, setTahakkukLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeDurum(id: string, durum: Row["durum"]) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/aidat/${id}/status`, {
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

  async function tahakkukOlustur() {
    setTahakkukLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aidat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donem }),
      });
      if (!res.ok) {
        setError("Tahakkuk oluşturulamadı.");
        return;
      }
      router.refresh();
    } finally {
      setTahakkukLoading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 mb-5">
        <KpiCard label="Tahsil Edilen" value={fmt.format(kpi.tahsilEdilen)} />
        <KpiCard label="Bekleyen" value={fmt.format(kpi.bekleyen)} accentClass="text-warning-fg" />
        <KpiCard label="Gecikmiş (faiz dahil)" value={fmt.format(kpi.gecikmis)} accentClass="text-danger-fg" />
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3.5">
        <div className="flex gap-2 flex-wrap">
          <BlokChip label="Tümü" active={!aktifBlok} href="/aidat" />
          {bloklar.map((b) => (
            <BlokChip key={b.id} label={`${b.ad} Blok`} active={aktifBlok === b.id} href={`/aidat?blok=${b.id}`} />
          ))}
        </div>
        <div className="text-sm text-ink-faint font-semibold">
          Dönem: <span className="text-ink font-bold">{donem}</span>
        </div>
      </div>

      {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}

      {rows.length === 0 ? (
        <div className="bg-white border border-card-border rounded-2xl p-10 text-center">
          <p className="text-sm text-ink-soft mb-4">{donem} dönemi için henüz aidat tahakkuku oluşturulmadı.</p>
          {canManage && (
            <button
              type="button"
              onClick={tahakkukOlustur}
              disabled={tahakkukLoading}
              className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-bold disabled:opacity-60"
            >
              {tahakkukLoading ? "Oluşturuluyor…" : "Bu Dönem İçin Tahakkuk Oluştur"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FAFBFD]">
                <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Daire</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Sakin</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Aidat Grubu</th>
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
                  <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{r.aidatGrubuAd}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="text-sm font-bold">{fmt.format(r.tutar)}</div>
                    {r.faiz > 0 && <div className="text-xs text-danger-fg font-semibold">+ {fmt.format(r.faiz)} faiz</div>}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <select
                      value={r.durum}
                      disabled={pendingId === r.id}
                      onChange={(e) => changeDurum(r.id, e.target.value as Row["durum"])}
                      className={`appearance-none border-0 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${DURUM_STYLE[r.durum]}`}
                    >
                      <option value="Odendi">{DURUM_LABEL.Odendi}</option>
                      <option value="Bekliyor">{DURUM_LABEL.Bekliyor}</option>
                      <option value="Gecikti">{DURUM_LABEL.Gecikti}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center px-6 py-3.5 border-t border-[#F0F2F7] bg-[#FAFBFD] text-sm">
            <span className="text-ink-soft font-semibold">
              {rows.length} daire listeleniyor · durum değiştirildiğinde gelir-gidere otomatik işlenir
            </span>
            <span className="font-bold">
              Tahsilat oranı: <span className="text-accent">%{Math.round((kpi.odendiSayisi / kpi.toplam) * 100)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, accentClass }: { label: string; value: string; accentClass?: string }) {
  return (
    <div className="bg-white border border-card-border rounded-2xl px-5 py-4.5">
      <div className="text-xs font-bold text-ink-soft mb-1.5">{label}</div>
      <div className={`text-2xl font-extrabold ${accentClass ?? ""}`}>{value}</div>
    </div>
  );
}

function BlokChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-2 rounded-lg border text-sm font-bold ${
        active ? "bg-accent border-accent text-white" : "border-card-border text-[#3C4660] bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
