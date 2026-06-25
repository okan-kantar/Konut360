"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import LogoutButton from "@/components/auth/LogoutButton";

interface GecmisSatiri {
  id: string;
  baslik: string;
  not: string;
  tutar: number;
  durum: "Bekliyor" | "Gecikti" | "Odendi";
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const DURUM_STYLE: Record<GecmisSatiri["durum"], string> = {
  Odendi: "bg-success-bg text-success-fg",
  Bekliyor: "bg-warning-bg text-warning-fg",
  Gecikti: "bg-danger-bg text-danger-fg",
};
const DURUM_LABEL: Record<GecmisSatiri["durum"], string> = {
  Odendi: "Ödendi",
  Bekliyor: "Bekliyor",
  Gecikti: "Gecikti",
};

export default function SakinPortalClient({
  adSoyad,
  daireLabel,
  guncelBorc,
  gecmis,
  ozet,
  iletisim,
}: {
  adSoyad: string;
  daireLabel: string;
  guncelBorc: { tutar: number; faiz: number; durum: "Bekliyor" | "Gecikti" | "Odendi" } | null;
  gecmis: GecmisSatiri[];
  ozet: { toplamOdenen: number; toplamBekleyen: number; zamanindaOdeme: number; yil: number };
  iletisim: { telefon1: string; eposta: string; plaka: string } | null;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [openGuncelle, setOpenGuncelle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    telefon1: iletisim?.telefon1 ?? "",
    eposta: iletisim?.eposta ?? "",
    plaka: iletisim?.plaka ?? "",
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function odemeTalimati() {
    try {
      const res = await fetch("/api/sakin/odeme-talimati", { method: "POST" });
      if (res.ok) {
        showToast("Ödeme talimatı oluşturuldu · yönetime iletildi");
      } else {
        showToast("Ödeme talimatı gönderilemedi, tekrar deneyin");
      }
    } catch {
      showToast("Bağlantı hatası, tekrar deneyin");
    }
  }

  async function guncellemeTalebiGonder() {
    setLoading(true);
    try {
      const res = await fetch("/api/sakin/guncelleme-talebi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpenGuncelle(false);
        showToast("İletişim bilgisi güncelleme talebi yönetime iletildi");
      } else {
        showToast("Talep gönderilemedi, tekrar deneyin");
      }
    } catch {
      showToast("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <header className="bg-white border-b border-card-border h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
        <div className="font-extrabold tracking-tight text-sm md:text-base">
          Konut<span className="text-accent">360</span>{" "}
          <span className="text-ink-faint font-semibold hidden sm:inline">· Sakin Portalı</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4 text-sm">
          <span className="font-semibold hidden sm:inline">{adSoyad}</span>
          <span className="text-ink-faint font-semibold">{daireLabel}</span>
          <LogoutButton className="text-sm font-semibold text-ink-soft hover:text-ink" />
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">
          Merhaba {adSoyad.split(" ")[0]},
        </h1>
        <p className="text-sm text-ink-soft mb-6">{daireLabel} dairesi</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-card-border rounded-2xl p-6 flex justify-between items-center gap-5 flex-wrap shadow-sm">
              <div>
                <div className="text-xs font-bold text-ink-soft uppercase tracking-wide mb-2">Güncel Borç</div>
                {guncelBorc ? (
                  <>
                    <div className="flex items-baseline gap-2.5 mb-1.5">
                      <div className="text-3xl font-extrabold tracking-tight">
                        {fmt.format(guncelBorc.tutar + guncelBorc.faiz)}
                      </div>
                      {guncelBorc.durum !== "Bekliyor" && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${DURUM_STYLE[guncelBorc.durum]}`}>
                          {DURUM_LABEL[guncelBorc.durum]}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-ink-soft">
                      Bu dönem aidatı · {fmt.format(guncelBorc.tutar)}
                      {guncelBorc.faiz > 0 && ` + ${fmt.format(guncelBorc.faiz)} gecikme faizi`}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-ink-soft">Bu dönem için henüz tahakkuk oluşturulmadı.</div>
                )}
              </div>
              {guncelBorc && guncelBorc.durum !== "Odendi" && (
                <button
                  type="button"
                  onClick={odemeTalimati}
                  className="px-5 py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-lg whitespace-nowrap"
                >
                  Ödeme Talimatı Oluştur
                </button>
              )}
            </div>

            <div className="bg-white border border-card-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5.5 py-4 border-b border-[#F0F2F7] text-sm font-bold">Ödeme &amp; Borç Geçmişi</div>
              {gecmis.length === 0 ? (
                <div className="px-5.5 py-8 text-center text-sm text-ink-soft">Henüz kayıt yok.</div>
              ) : (
                gecmis.map((g, i) => (
                  <div key={g.id} className={`flex justify-between items-center px-5.5 py-3.5 ${i === 0 ? "" : "border-t border-[#F6F7FA]"}`}>
                    <div>
                      <div className="text-sm font-bold">{g.baslik}</div>
                      <div className="text-xs text-ink-faint">{g.not}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{fmt.format(g.tutar)}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${DURUM_STYLE[g.durum]}`}>
                        {DURUM_LABEL[g.durum]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-navy rounded-2xl p-5.5 text-white shadow-lg">
              <div className="text-xs font-bold text-[#9AA7C2] mb-3.5">{ozet.yil} Özetim</div>
              <div className="flex justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-[#A7B2CC]">Toplam ödenen</span>
                <span className="font-bold">{fmt.format(ozet.toplamOdenen)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-[#A7B2CC]">Bekleyen</span>
                <span className="font-bold text-[#FFC56B]">{fmt.format(ozet.toplamBekleyen)}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-[#A7B2CC]">Zamanında ödeme</span>
                <span className="font-bold">%{ozet.zamanindaOdeme}</span>
              </div>
            </div>

            <div className="bg-white border border-card-border rounded-2xl p-5.5 shadow-sm">
              <div className="text-sm font-bold mb-4">İletişim Bilgilerim</div>
              <div className="flex justify-between py-2.5 border-b border-bg text-sm">
                <span className="text-ink-soft">Telefon</span>
                <span className="font-bold">{iletisim?.telefon1 || "—"}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-bg text-sm">
                <span className="text-ink-soft">E-posta</span>
                <span className="font-bold">{iletisim?.eposta || "—"}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-ink-soft">Araç Plakası</span>
                <span className="font-bold">{iletisim?.plaka || "—"}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpenGuncelle(true)}
                className="w-full mt-3.5 py-2.5 border border-card-border rounded-xl text-sm font-bold text-[#3C4660]"
              >
                Bilgilerimi Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>

      {openGuncelle && (
        <Modal title="Bilgilerimi Güncelle" subtitle="Talebiniz yönetime iletilir, onaylandığında kaydınız güncellenir" onClose={() => setOpenGuncelle(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Telefon">
              <input
                value={form.telefon1}
                onChange={(e) => setForm((f) => ({ ...f, telefon1: e.target.value }))}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="E-posta">
              <input
                value={form.eposta}
                onChange={(e) => setForm((f) => ({ ...f, eposta: e.target.value }))}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Araç Plakası">
              <input
                value={form.plaka}
                onChange={(e) => setForm((f) => ({ ...f, plaka: e.target.value }))}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2.5 mt-5">
            <button type="button" onClick={() => setOpenGuncelle(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={guncellemeTalebiGonder}
              disabled={loading}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Talebi Gönder
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 bg-navy text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl z-[90]">
          {toast}
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#3C4660] mb-2">{label}</label>
      {children}
    </div>
  );
}
