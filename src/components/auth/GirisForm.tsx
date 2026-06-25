"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SiteOption {
  slug: string;
  ad: string;
}

export default function GirisForm({ sites }: { sites: SiteOption[] }) {
  const router = useRouter();
  const [rol, setRol] = useState<"site_yoneticisi" | "site_sakini">("site_yoneticisi");
  const [siteSlug, setSiteSlug] = useState(sites[0]?.slug ?? "");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteSlug, rol, kullaniciAdi, sifre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "too_many_attempts"
            ? "Çok fazla deneme yapıldı, lütfen birkaç dakika sonra tekrar deneyin."
            : "Kullanıcı adı, şifre veya site bilgisi hatalı.",
        );
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-[1.05] flex-col justify-between bg-gradient-to-br from-[#0E1B33] via-[#13264a] to-[#0c1730] text-white p-14 relative overflow-hidden">
        <div className="absolute -top-28 -right-24 w-80 h-80 rounded-full bg-accent opacity-20 blur-sm" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.7">
              <rect x="4" y="3" width="9" height="14" rx="1.2" />
              <rect x="13" y="8" width="3.5" height="9" rx="1" />
            </svg>
          </div>
          <div className="text-xl font-extrabold tracking-tight">
            Konut<span className="text-accent">360</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <div className="text-xs font-bold uppercase tracking-widest text-[#7E8DB0] mb-4">
            Site Yönetim Sistemi
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-5">
            Aidattan kasaya,
            <br />
            tüm yönetim tek panelde.
          </h1>
          <p className="text-base leading-relaxed text-[#A7B2CC] mb-8">
            Çok siteli yapı, otomatik gecikme faizi, kasa takibi ve sakin bilgilendirme —
            apartman ve site yönetimi için uçtan uca dijital çözüm.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-[#C7D0E4]">
            <li className="flex items-center gap-3">
              <CheckBadge /> Dönemsel aidat tahakkuk &amp; otomatik faiz
            </li>
            <li className="flex items-center gap-3">
              <CheckBadge /> Çoklu kasa &amp; gelir-gider mutabakatı
            </li>
            <li className="flex items-center gap-3">
              <CheckBadge /> Sakin self-servis borç &amp; ödeme görünümü
            </li>
          </ul>
        </div>
        <div className="relative text-xs text-[#6E7C9C]">
          © 2026 Konut360 · Çok kiracılı (multi-tenant) yapı
        </div>
      </div>

      <div className="flex-1 lg:flex-[.95] flex items-center justify-center p-10 bg-bg">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Tekrar hoş geldiniz</h2>
          <p className="text-sm text-ink-soft mb-7">Yönetim panelinize giriş yapın.</p>

          <div className="flex gap-2 bg-[#EAEEF5] p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRol("site_yoneticisi")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                rol === "site_yoneticisi" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Site Yöneticisi
            </button>
            <button
              type="button"
              onClick={() => setRol("site_sakini")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                rol === "site_sakini" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Site Sakini
            </button>
          </div>

          <label className="block text-xs font-bold text-[#3C4660] mb-2">Site</label>
          <select
            value={siteSlug}
            onChange={(e) => setSiteSlug(e.target.value)}
            className="w-full px-3.5 py-3 border border-card-border rounded-xl bg-white text-sm font-semibold mb-4"
          >
            {sites.length === 0 && <option value="">Kayıtlı site yok</option>}
            {sites.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.ad}
              </option>
            ))}
          </select>

          <label className="block text-xs font-bold text-[#3C4660] mb-2">Kullanıcı Adı</label>
          <input
            type="text"
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className="w-full px-3.5 py-3 border border-card-border rounded-xl bg-white text-sm mb-4"
            autoComplete="username"
            required
          />

          <label className="block text-xs font-bold text-[#3C4660] mb-2">Şifre</label>
          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="w-full px-3.5 py-3 border border-card-border rounded-xl bg-white text-sm mb-5"
            autoComplete="current-password"
            required
          />

          {error && <p className="text-sm text-[#C0392B] mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading || sites.length === 0}
            className="w-full py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-lg disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CheckBadge() {
  return (
    <span className="w-5.5 h-5.5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="2.4">
        <polyline points="4,11 8,15 16,5" />
      </svg>
    </span>
  );
}
