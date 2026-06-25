"use client";

import { useState } from "react";
import type { RaporVerileri } from "@/lib/services/raporlar";

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

type RaporTip = "gelir-gider" | "borc-dokumu" | "kasa-detay" | "tahsilat" | "firma-odemeleri" | "yillik";

const RAPORLAR: { tip: RaporTip; ad: string; aciklama: string }[] = [
  { tip: "gelir-gider", ad: "Aylık Gelir-Gider Raporu", aciklama: "Seçili dönem için tüm kasaların gelir ve gider dökümü, net bakiye değişimi." },
  { tip: "borc-dokumu", ad: "Daire Bazlı Borç Dökümü", aciklama: "Her dairenin güncel aidat ve ek ödenek borcu, gecikme faizi dahil detay." },
  { tip: "kasa-detay", ad: "Kasa Hareket Detayı", aciklama: "Kasa bazında tüm giriş/çıkış hareketleri ve ödeme yöntemi kırılımı." },
  { tip: "tahsilat", ad: "Tahsilat Performansı", aciklama: "Dönemsel tahsilat oranı, gecikme eğilimi ve blok bazlı karşılaştırma." },
  { tip: "firma-odemeleri", ad: "Firma Ödemeleri", aciklama: "Tedarikçi firmalara yapılan ödemelerin hizmet türü bazında özeti." },
  { tip: "yillik", ad: "Yıllık Konsolide Rapor", aciklama: "Tüm dönemlerin birleşik gelir-gider ve bakiye özeti, yıl sonu raporu." },
];

export default function RaporlarClient({ veri }: { veri: RaporVerileri }) {
  const [secili, setSecili] = useState<RaporTip | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function exportTalep(tip: RaporTip, ad: string, format: "excel" | "pdf") {
    const formatAd = format === "excel" ? "Excel" : "PDF";
    setToast(`${ad} · ${formatAd} hazırlanıyor…`);

    const res = await fetch(`/api/raporlar/${tip}/export-talep?format=${format}`, { method: "POST" });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename\*=UTF-8''(.+)/);
      a.href = url;
      a.download = match ? decodeURIComponent(match[1]) : `${tip}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast(`${ad} · ${formatAd} indirildi`);
    } else {
      setToast(`${ad} · ${formatAd} indirilemedi, tekrar deneyin`);
    }

    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        {RAPORLAR.map((r) => (
          <div
            key={r.tip}
            className={`bg-white border rounded-2xl p-5.5 flex gap-4 cursor-pointer transition ${
              secili === r.tip ? "border-accent" : "border-card-border"
            }`}
            onClick={() => setSecili(secili === r.tip ? null : r.tip)}
          >
            <div className="w-11.5 h-11.5 rounded-xl bg-[#EEF3FF] text-accent flex items-center justify-center flex-none">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="3" width="12" height="14" rx="1.6" />
                <line x1="7" y1="7" x2="13" y2="7" />
                <line x1="7" y1="10" x2="13" y2="10" />
                <line x1="7" y1="13" x2="11" y2="13" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{r.ad}</div>
              <div className="text-xs text-ink-soft leading-relaxed mt-1 mb-3.5">{r.aciklama}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTalep(r.tip, r.ad, "excel");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded-lg text-xs font-bold text-success-fg"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTalep(r.tip, r.ad, "pdf");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded-lg text-xs font-bold text-danger-fg"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {secili && (
        <div className="bg-white border border-card-border rounded-2xl mt-5 overflow-hidden">
          <div className="px-5.5 py-4 border-b border-[#F0F2F7] text-sm font-bold">
            {RAPORLAR.find((r) => r.tip === secili)?.ad} — Önizleme
          </div>
          <div className="p-5.5">
            {secili === "gelir-gider" && <GelirGiderTablo veri={veri} />}
            {secili === "borc-dokumu" && <BorcDokumuTablo veri={veri} />}
            {secili === "kasa-detay" && <KasaDetayTablo veri={veri} />}
            {secili === "tahsilat" && <TahsilatTablo veri={veri} />}
            {secili === "firma-odemeleri" && <FirmaOdemeleriTablo veri={veri} />}
            {secili === "yillik" && <YillikTablo veri={veri} />}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 bg-navy text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl z-[90]">
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-soft py-4 text-center">{children}</p>;
}

function GelirGiderTablo({ veri }: { veri: RaporVerileri }) {
  if (veri.aylikGelirGider.length === 0) return <EmptyRow>Henüz kasa tanımlanmadı.</EmptyRow>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-bold text-ink-faint uppercase">
          <th className="py-2">Kasa</th>
          <th className="py-2 text-right">Gelir</th>
          <th className="py-2 text-right">Gider</th>
          <th className="py-2 text-right">Net</th>
        </tr>
      </thead>
      <tbody>
        {veri.aylikGelirGider.map((k) => (
          <tr key={k.kasaAd} className="border-t border-bg">
            <td className="py-2.5 font-semibold">{k.kasaAd}</td>
            <td className="py-2.5 text-right text-success-fg font-bold">{fmt.format(k.gelir)}</td>
            <td className="py-2.5 text-right font-bold">{fmt.format(k.gider)}</td>
            <td className={`py-2.5 text-right font-bold ${k.net >= 0 ? "text-success-fg" : "text-danger-fg"}`}>{fmt.format(k.net)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BorcDokumuTablo({ veri }: { veri: RaporVerileri }) {
  if (veri.daireBorclari.length === 0) return <EmptyRow>Borçlu daire yok.</EmptyRow>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-bold text-ink-faint uppercase">
          <th className="py-2">Daire</th>
          <th className="py-2">Sakin</th>
          <th className="py-2 text-right">Kalem</th>
          <th className="py-2 text-right">Toplam Borç</th>
        </tr>
      </thead>
      <tbody>
        {veri.daireBorclari.map((d) => (
          <tr key={d.daireLabel} className="border-t border-bg">
            <td className="py-2.5 font-semibold">{d.daireLabel}</td>
            <td className="py-2.5">{d.sakin}</td>
            <td className="py-2.5 text-right">{d.kalemSayisi}</td>
            <td className="py-2.5 text-right font-bold text-danger-fg">{fmt.format(d.toplamBorc)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function KasaDetayTablo({ veri }: { veri: RaporVerileri }) {
  if (veri.kasaHareketDetayi.length === 0) return <EmptyRow>Henüz kasa tanımlanmadı.</EmptyRow>;
  return (
    <div className="flex flex-col gap-5">
      {veri.kasaHareketDetayi.map((k) => (
        <div key={k.kasaAd}>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold">{k.kasaAd}</span>
            <span className="text-sm font-bold">{fmt.format(k.guncelBakiye)}</span>
          </div>
          {k.yontemler.length === 0 ? (
            <p className="text-xs text-ink-faint">Hareket yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-ink-faint uppercase">
                  <th className="py-1.5">Ödeme Yöntemi</th>
                  <th className="py-1.5 text-right">Adet</th>
                  <th className="py-1.5 text-right">Gelir</th>
                  <th className="py-1.5 text-right">Gider</th>
                </tr>
              </thead>
              <tbody>
                {k.yontemler.map((y) => (
                  <tr key={y.yontem} className="border-t border-bg">
                    <td className="py-2 font-semibold">{y.yontem}</td>
                    <td className="py-2 text-right">{y.adet}</td>
                    <td className="py-2 text-right text-success-fg font-bold">{fmt.format(y.gelir)}</td>
                    <td className="py-2 text-right font-bold">{fmt.format(y.gider)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

function TahsilatTablo({ veri }: { veri: RaporVerileri }) {
  return (
    <div>
      <div className="mb-4 text-sm">
        Genel tahsilat oranı: <span className="font-extrabold text-accent">%{veri.tahsilatPerformansi.genelOran}</span>
      </div>
      {veri.tahsilatPerformansi.blokPerformansi.length === 0 ? (
        <EmptyRow>Henüz blok tanımlanmadı.</EmptyRow>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-ink-faint uppercase">
              <th className="py-2">Blok</th>
              <th className="py-2 text-right">Ödenen / Toplam</th>
              <th className="py-2 text-right">Oran</th>
            </tr>
          </thead>
          <tbody>
            {veri.tahsilatPerformansi.blokPerformansi.map((b) => (
              <tr key={b.blokAd} className="border-t border-bg">
                <td className="py-2.5 font-semibold">{b.blokAd} Blok</td>
                <td className="py-2.5 text-right">
                  {b.odendi}/{b.toplam}
                </td>
                <td className="py-2.5 text-right font-bold text-accent">%{b.oran}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FirmaOdemeleriTablo({ veri }: { veri: RaporVerileri }) {
  if (veri.firmaOdemeleri.length === 0) return <EmptyRow>Bu yıl firma ödemesi kaydedilmedi.</EmptyRow>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-bold text-ink-faint uppercase">
          <th className="py-2">Firma</th>
          <th className="py-2">Hizmet</th>
          <th className="py-2 text-right">İşlem</th>
          <th className="py-2 text-right">Toplam Ödeme</th>
        </tr>
      </thead>
      <tbody>
        {veri.firmaOdemeleri.map((f) => (
          <tr key={f.firmaAd} className="border-t border-bg">
            <td className="py-2.5 font-semibold">{f.firmaAd}</td>
            <td className="py-2.5 text-ink-soft">{f.hizmet}</td>
            <td className="py-2.5 text-right">{f.islemSayisi}</td>
            <td className="py-2.5 text-right font-bold">{fmt.format(f.toplamTutar)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function YillikTablo({ veri }: { veri: RaporVerileri }) {
  return (
    <div>
      <div className="flex gap-6 mb-4 text-sm">
        <span>
          Toplam Gelir: <span className="font-extrabold text-success-fg">{fmt.format(veri.yillikKonsolide.toplamGelir)}</span>
        </span>
        <span>
          Toplam Gider: <span className="font-extrabold">{fmt.format(veri.yillikKonsolide.toplamGider)}</span>
        </span>
        <span>
          Net:{" "}
          <span className="font-extrabold text-accent">
            {fmt.format(veri.yillikKonsolide.toplamGelir - veri.yillikKonsolide.toplamGider)}
          </span>
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-ink-faint uppercase">
            <th className="py-2">Ay</th>
            <th className="py-2 text-right">Gelir</th>
            <th className="py-2 text-right">Gider</th>
            <th className="py-2 text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {veri.yillikKonsolide.aylar.map((a) => (
            <tr key={a.ay} className="border-t border-bg">
              <td className="py-2 font-semibold">{a.ay}</td>
              <td className="py-2 text-right text-success-fg font-bold">{fmt.format(a.gelir)}</td>
              <td className="py-2 text-right font-bold">{fmt.format(a.gider)}</td>
              <td className={`py-2 text-right font-bold ${a.net >= 0 ? "text-success-fg" : "text-danger-fg"}`}>{fmt.format(a.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
