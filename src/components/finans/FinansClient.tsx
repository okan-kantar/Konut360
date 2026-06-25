"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

interface Kasa {
  id: string;
  ad: string;
  tip: string;
  guncelBakiye: number;
}
interface Hareket {
  id: string;
  tarih: string;
  aciklama: string;
  kategori: string;
  kasaAd: string;
  tip: "Gelir" | "Gider";
  tutar: number;
  kaynak: string;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

export default function FinansClient({
  kasalar,
  anaKasaToplami,
  hareketler,
  gelirTurleri,
  giderTurleri,
  odemeYontemleri,
}: {
  kasalar: Kasa[];
  anaKasaToplami: number;
  hareketler: Hareket[];
  gelirTurleri: string[];
  giderTurleri: string[];
  odemeYontemleri: string[];
}) {
  const router = useRouter();
  const [openTx, setOpenTx] = useState(false);
  const [openKasa, setOpenKasa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [tx, setTx] = useState({
    tip: "Gider" as "Gelir" | "Gider",
    tarih: new Date().toISOString().slice(0, 10),
    tutar: "",
    kategori: giderTurleri[0] ?? "",
    kasaId: kasalar[0]?.id ?? "",
    odemeYontemi: odemeYontemleri[0] ?? "Nakit",
    aciklama: "",
  });
  const [kasaForm, setKasaForm] = useState({ ad: "", tip: "Banka Hesabı", acilisBakiyesi: "" });

  function setTxField<K extends keyof typeof tx>(key: K, value: (typeof tx)[K]) {
    setTx((f) => {
      const next = { ...f, [key]: value };
      if (key === "tip") {
        next.kategori = (value === "Gelir" ? gelirTurleri[0] : giderTurleri[0]) ?? "";
      }
      return next;
    });
  }

  async function submitTx() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gelir-gider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (!res.ok) {
        setError("Kayıt eklenemedi.");
        return;
      }
      setOpenTx(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitKasa() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kasalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kasaForm),
      });
      if (!res.ok) {
        setError("Kasa oluşturulamadı.");
        return;
      }
      setOpenKasa(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteHareket(id: string) {
    setPendingDelete(id);
    setError(null);
    try {
      const res = await fetch(`/api/gelir-gider/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "otomatik_kayit_silinemez"
            ? "Bu kayıt aidat/ek ödenek tahsilatından otomatik oluştu; ilgili ekrandan durumu geri alın."
            : "Kayıt silinemedi.",
        );
        return;
      }
      router.refresh();
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4.5 mb-5.5">
        {kasalar.map((k) => (
          <div key={k.id} className="bg-white border border-card-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7.5 h-7.5 rounded-lg bg-[#EEF3FF] text-accent flex items-center justify-center flex-none">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="3" y="5" width="14" height="11" rx="2" />
                  <line x1="3" y1="9" x2="17" y2="9" />
                </svg>
              </div>
              <div className="text-xs font-bold text-[#3C4660]">{k.ad}</div>
            </div>
            <div className="text-xl font-extrabold">{fmt.format(k.guncelBakiye)}</div>
            <div className="text-xs text-ink-faint font-semibold mt-1">{k.tip}</div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpenKasa(true)}
          className="bg-white border border-dashed border-card-border rounded-2xl p-5 flex flex-col items-center justify-center text-sm font-bold text-ink-soft hover:border-accent hover:text-accent"
        >
          + Kasa Ekle
        </button>
        <div className="bg-navy rounded-2xl p-5 text-white shadow-lg md:col-span-1">
          <div className="text-xs font-bold text-[#9AA7C2] mb-3.5">Ana Kasa Toplamı</div>
          <div className="text-xl font-extrabold">{fmt.format(anaKasaToplami)}</div>
          <div className="text-xs text-[#7E8DB0] font-semibold mt-1">{kasalar.length} kasa birleşik bakiye</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-bold">Kasa Hareketleri</div>
        <button
          type="button"
          onClick={() => setOpenTx(true)}
          disabled={kasalar.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold disabled:opacity-60"
        >
          + Kayıt Ekle
        </button>
      </div>

      {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}

      <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FAFBFD]">
              <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Tarih</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Açıklama</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Kategori</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Kasa</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-ink-faint uppercase">Tutar</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {hareketler.map((h, i) => (
              <tr key={h.id} className={i === 0 ? "" : "border-t border-[#F0F2F7]"}>
                <td className="px-6 py-3.5 text-sm text-ink-soft font-semibold whitespace-nowrap">{dateFmt(h.tarih)}</td>
                <td className="px-4 py-3.5 text-sm font-semibold">{h.aciklama}</td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-bold text-ink-soft bg-bg px-2.5 py-1 rounded-lg">{h.kategori}</span>
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{h.kasaAd}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-bold ${h.tip === "Gelir" ? "text-success-fg" : "text-ink"}`}>
                    {h.tip === "Gelir" ? "+ " : "– "}
                    {fmt.format(h.tutar)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  {h.kaynak === "manuel" ? (
                    <button
                      type="button"
                      onClick={() => deleteHareket(h.id)}
                      disabled={pendingDelete === h.id}
                      className="text-xs font-bold text-danger-fg disabled:opacity-50"
                    >
                      Sil
                    </button>
                  ) : (
                    <span className="text-xs text-ink-faint font-semibold">otomatik</span>
                  )}
                </td>
              </tr>
            ))}
            {hareketler.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-soft">
                  Henüz kasa hareketi yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openTx && (
        <Modal title="Yeni Kasa Hareketi" subtitle="Gelir veya gider kaydını kasaya işleyin" onClose={() => setOpenTx(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 bg-[#EFF2F7] p-1 rounded-xl">
              {(["Gelir", "Gider"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxField("tip", t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold ${tx.tip === t ? "bg-white shadow-sm text-ink" : "text-ink-soft"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <Field label="Tarih" className="flex-1">
                <input
                  type="date"
                  value={tx.tarih}
                  onChange={(e) => setTxField("tarih", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
              <Field label="Tutar (₺)" className="flex-1">
                <input
                  type="number"
                  min="0"
                  value={tx.tutar}
                  onChange={(e) => setTxField("tutar", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
                />
              </Field>
            </div>
            <div className="flex gap-4">
              <Field label="Kategori" className="flex-1">
                <select
                  value={tx.kategori}
                  onChange={(e) => setTxField("kategori", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
                >
                  {(tx.tip === "Gelir" ? gelirTurleri : giderTurleri).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                  {(tx.tip === "Gelir" ? gelirTurleri : giderTurleri).length === 0 && <option value="Diğer">Diğer</option>}
                </select>
              </Field>
              <Field label="Kasa" className="flex-1">
                <select
                  value={tx.kasaId}
                  onChange={(e) => setTxField("kasaId", e.target.value)}
                  className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
                >
                  {kasalar.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ad}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Ödeme Yöntemi">
              <select
                value={tx.odemeYontemi}
                onChange={(e) => setTxField("odemeYontemi", e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
              >
                {(odemeYontemleri.length > 0 ? odemeYontemleri : ["Nakit", "Havale/EFT", "Kredi Kartı"]).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Açıklama">
              <textarea
                value={tx.aciklama}
                onChange={(e) => setTxField("aciklama", e.target.value)}
                rows={2}
                placeholder="Hareket açıklaması…"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm resize-vertical"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-[#C0392B] mt-4">{error}</p>}
          <div className="flex justify-end gap-2.5 mt-5">
            <button type="button" onClick={() => setOpenTx(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submitTx}
              disabled={loading || !tx.tutar || !tx.kasaId || !tx.kategori}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Kaydı İşle
            </button>
          </div>
        </Modal>
      )}

      {openKasa && (
        <Modal title="Yeni Kasa" subtitle="Kasa adı, tipi ve açılış bakiyesini girin" onClose={() => setOpenKasa(false)}>
          <div className="flex flex-col gap-4">
            <Field label="Kasa Adı">
              <input
                value={kasaForm.ad}
                onChange={(e) => setKasaForm((f) => ({ ...f, ad: e.target.value }))}
                placeholder="örn. Enpara Kasası"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
            <Field label="Tip">
              <select
                value={kasaForm.tip}
                onChange={(e) => setKasaForm((f) => ({ ...f, tip: e.target.value }))}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm font-semibold"
              >
                <option value="Banka Hesabı">Banka Hesabı</option>
                <option value="Nakit">Nakit</option>
              </select>
            </Field>
            <Field label="Açılış Bakiyesi (₺)">
              <input
                type="number"
                value={kasaForm.acilisBakiyesi}
                onChange={(e) => setKasaForm((f) => ({ ...f, acilisBakiyesi: e.target.value }))}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-[#C0392B] mt-4">{error}</p>}
          <div className="flex justify-end gap-2.5 mt-5">
            <button type="button" onClick={() => setOpenKasa(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submitKasa}
              disabled={loading || !kasaForm.ad.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Kasayı Kaydet
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
