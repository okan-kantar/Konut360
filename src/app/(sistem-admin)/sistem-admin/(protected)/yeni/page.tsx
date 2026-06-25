"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function YeniSitePage() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [yoneticiAdSoyad, setYoneticiAdSoyad] = useState("");
  const [yoneticiKullaniciAdi, setYoneticiKullaniciAdi] = useState("");
  const [yoneticiSifre, setYoneticiSifre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sistem-admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, yoneticiAdSoyad, yoneticiKullaniciAdi, yoneticiSifre }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "invalid_request"
            ? "Lütfen tüm alanları doğru doldurun (şifre en az 6 karakter)."
            : "Site oluşturulamadı.",
        );
        return;
      }
      router.push("/sistem-admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/sistem-admin" className="text-sm font-semibold text-ink-soft mb-4 inline-block">
        ← Site listesine dön
      </Link>
      <h1 className="text-xl font-extrabold tracking-tight mb-6">Yeni Site Oluştur</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-card-border rounded-2xl p-6 flex flex-col gap-4"
      >
        <div>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Site Adı</label>
          <input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            required
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">
            Site Yöneticisi Ad Soyad
          </label>
          <input
            value={yoneticiAdSoyad}
            onChange={(e) => setYoneticiAdSoyad(e.target.value)}
            required
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">
            Yönetici Kullanıcı Adı
          </label>
          <input
            value={yoneticiKullaniciAdi}
            onChange={(e) => setYoneticiKullaniciAdi(e.target.value)}
            required
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#3C4660] mb-2">Yönetici Şifresi</label>
          <input
            type="password"
            value={yoneticiSifre}
            onChange={(e) => setYoneticiSifre(e.target.value)}
            required
            minLength={6}
            className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
          />
        </div>
        {error && <p className="text-sm text-[#C0392B]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="py-3 rounded-xl bg-accent text-white text-sm font-bold disabled:opacity-60"
        >
          {loading ? "Oluşturuluyor…" : "Siteyi Oluştur"}
        </button>
      </form>
    </div>
  );
}
