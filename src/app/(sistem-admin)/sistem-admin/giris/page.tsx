"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SistemAdminGirisPage() {
  const router = useRouter();
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sistem-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullaniciAdi, sifre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Kullanıcı adı veya şifre hatalı.");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.7">
              <rect x="4" y="3" width="9" height="14" rx="1.2" />
              <rect x="13" y="8" width="3.5" height="9" rx="1" />
            </svg>
          </div>
          <div className="text-base font-extrabold tracking-tight">
            Konut<span className="text-accent">360</span>{" "}
            <span className="text-ink-faint font-semibold">· Sistem Yönetimi</span>
          </div>
        </div>

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
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-lg disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş Yap →"}
        </button>
      </form>
    </main>
  );
}
