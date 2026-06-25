"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function SakinGirisiYonet({
  daireId,
  mevcutKullaniciAdi,
}: {
  daireId: string;
  mevcutKullaniciAdi: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kullaniciAdi, setKullaniciAdi] = useState(mevcutKullaniciAdi ?? "");
  const [sifre, setSifre] = useState("");

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daireler/${daireId}/sakin-girisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullaniciAdi, sifre }),
      });
      if (!res.ok) {
        setError("Giriş bilgisi kaydedilemedi.");
        return;
      }
      setOpen(false);
      setSifre("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-card-border rounded-2xl p-5.5">
      <div className="text-sm font-bold mb-3">Sakin Portalı Girişi</div>
      {mevcutKullaniciAdi ? (
        <div className="flex justify-between items-center text-sm">
          <span className="text-ink-soft">
            Kullanıcı adı: <span className="font-bold text-ink">{mevcutKullaniciAdi}</span>
          </span>
          <button type="button" onClick={() => setOpen(true)} className="px-3 py-1.5 border border-card-border rounded-lg text-xs font-bold">
            Şifre Sıfırla
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center text-sm">
          <span className="text-ink-faint">Bu daire için henüz sakin girişi oluşturulmadı.</span>
          <button type="button" onClick={() => setOpen(true)} className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold">
            Giriş Bilgisi Oluştur
          </button>
        </div>
      )}

      {open && (
        <Modal title="Sakin Portalı Girişi" subtitle="Aktif sakin için kullanıcı adı ve şifre belirleyin" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#3C4660] mb-2">Kullanıcı Adı</label>
              <input
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3C4660] mb-2">Şifre</label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-3.5 py-3 border border-card-border rounded-xl text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-[#C0392B] mt-4">{error}</p>}
          <div className="flex justify-end gap-2.5 mt-5">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 border border-card-border rounded-lg text-sm font-bold">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading || kullaniciAdi.trim().length < 3 || sifre.length < 6}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-60"
            >
              Kaydet
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
