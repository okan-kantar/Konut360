"use client";

import { useEffect } from "react";

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(14,27,51,0.46)] backdrop-blur-sm z-[80] flex items-start justify-center p-12 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#F0F2F7]">
          <div>
            <div className="text-lg font-extrabold tracking-tight">{title}</div>
            {subtitle && <div className="text-sm text-ink-faint mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-card-border rounded-lg flex items-center justify-center text-ink-faint"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
