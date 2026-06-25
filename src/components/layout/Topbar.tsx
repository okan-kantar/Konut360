"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ROUTE_META: Record<string, [string, string]> = {
  "/dashboard": ["Genel Bakış", "Site geneli özet"],
  "/aidat": ["Aidat Listesi", "Dönem bazlı tahsilat takibi ve durum yönetimi"],
  "/ekodenek": ["Ek Ödenekler", "Toplu borçlandırma ve tahsilat takibi"],
  "/finans": ["Gelir-Gider & Kasa", "Kasa bakiyeleri ve cari hareketler"],
  "/raporlar": ["Raporlar", "Dönemsel rapor üretimi ve dışa aktarım"],
  "/daireler": ["Daireler & Sakinler", "Daire, sakin ve borç durumu listesi"],
  "/bloklar": ["Bloklar", "Site blok yapısı ve doluluk"],
  "/firmalar": ["Firmalar", "Tedarikçi ve hizmet firma kayıtları"],
  "/tanimlar": ["Tanımlar", "Parametrik kod listeleri yönetimi"],
};

function getRouteMeta(pathname: string): [string, string] {
  const key = Object.keys(ROUTE_META).find(
    (k) => pathname === k || pathname.startsWith(`${k}/`),
  );
  return key ? ROUTE_META[key] : ["Konut360", ""];
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [title, subtitle] = getRouteMeta(pathname);
  const [q, setQ] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = q.trim();
      if (trimmed) {
        router.push(`/daireler?q=${encodeURIComponent(trimmed)}`);
      } else if (pathname.startsWith("/daireler")) {
        router.push("/daireler");
      }
    }, 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, pathname, router]);

  return (
    <header className="h-[66px] flex-none bg-white border-b border-card-border flex items-center px-7.5 gap-5 sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <div className="text-[17px] font-extrabold tracking-tight leading-tight">{title}</div>
        <div className="text-xs text-ink-faint">{subtitle}</div>
      </div>
      <div className="hidden md:flex items-center gap-2 bg-bg border border-card-border rounded-lg px-3 py-2 w-52">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#98A2B3" strokeWidth="1.8">
          <circle cx="9" cy="9" r="6" />
          <line x1="13.5" y1="13.5" x2="17" y2="17" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Daire, sakin ara…"
          className="border-none bg-transparent text-sm w-full outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="text-ink-faint hover:text-ink text-base leading-none"
            aria-label="Aramayı temizle"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="button"
        className="w-10 h-10 border border-card-border rounded-lg bg-white flex items-center justify-center relative"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#5C6982" strokeWidth="1.7">
          <path d="M6 8a4 4 0 0 1 8 0c0 4 1.5 5 1.5 5h-11S6 12 6 8Z" />
          <path d="M8.5 16a1.5 1.5 0 0 0 3 0" />
        </svg>
      </button>
    </header>
  );
}
