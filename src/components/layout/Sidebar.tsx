"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "./NavIcon";
import LogoutButton from "@/components/auth/LogoutButton";
import type { Role } from "@/lib/auth/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: Parameters<typeof NavIcon>[0]["kind"];
  /** Belirtilmezse tüm roller görebilir. */
  roles?: Role[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  /** Belirtilmezse tüm roller görebilir. */
  roles?: Role[];
}

const NAV_GROUPS: NavGroup[] = [
  { title: "Genel", items: [{ label: "Genel Bakış", href: "/dashboard", icon: "dashboard" }] },
  {
    title: "Tahsilat",
    items: [
      { label: "Aidat Listesi", href: "/aidat", icon: "aidat" },
      { label: "Ek Ödenekler", href: "/ekodenek", icon: "ekodenek" },
    ],
  },
  {
    title: "Finans",
    items: [
      { label: "Gelir-Gider & Kasa", href: "/finans", icon: "finans" },
      { label: "Raporlar", href: "/raporlar", icon: "rapor" },
    ],
  },
  {
    title: "Yönetim",
    // muhasebe rolü bu menüyü göremez (daireler/bloklar/firmalar/tanımlar daire:manage + tanim:manage gerektirir)
    roles: ["site_yoneticisi"],
    items: [
      { label: "Daireler & Sakinler", href: "/daireler", icon: "daire" },
      { label: "Bloklar", href: "/bloklar", icon: "blok" },
      { label: "Firmalar", href: "/firmalar", icon: "firma" },
      { label: "Tanımlar", href: "/tanimlar", icon: "tanim" },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  site_yoneticisi: "Site Yöneticisi",
  muhasebe: "Muhasebe / Veznedar",
};

function initials(adSoyad: string): string {
  const parts = adSoyad.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Sidebar({ adSoyad, rol }: { adSoyad: string; rol: Role }) {
  const pathname = usePathname();

  return (
    <aside className="w-[248px] flex-none bg-navy text-white flex flex-col sticky top-0 h-screen">
      <div className="px-5 pt-5.5 pb-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-none">
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.7">
            <rect x="4" y="3" width="9" height="14" rx="1.2" />
            <rect x="13" y="8" width="3.5" height="9" rx="1" />
          </svg>
        </div>
        <div className="text-lg font-extrabold tracking-tight">
          Konut<span className="text-accent">360</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3.5">
        {NAV_GROUPS.filter((g) => !g.roles || g.roles.includes(rol)).map((group) => (
          <div key={group.title}>
            <div className="text-[10.5px] font-bold tracking-widest text-[#5E6E92] uppercase px-2.5 mt-4.5 mb-2">
              {group.title}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-semibold mb-0.5 ${
                    active ? "bg-white/[0.09] text-white" : "text-[#93A0BC] hover:text-white"
                  }`}
                >
                  <NavIcon kind={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04]">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-xs font-extrabold flex-none">
            {initials(adSoyad)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{adSoyad}</div>
            <div className="text-xs text-[#7E8DB0]">{ROLE_LABEL[rol] ?? rol}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
