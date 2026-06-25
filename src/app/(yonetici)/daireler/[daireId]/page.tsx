import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import Daire from "@/models/Daire";
import AidatKaydi from "@/models/AidatKaydi";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";
import SakinGuncellemeTalebi from "@/models/SakinGuncellemeTalebi";
import User from "@/models/User";
import Site from "@/models/Site";
import { efektifFaiz } from "@/lib/services/efektifFaiz";
import { senkronizeGecikenDurumlar } from "@/lib/services/aidatDurumGuncelle";
import { requirePageSession } from "@/lib/auth/session";
import SakinDegistirButton from "@/components/daireler/SakinDegistirButton";
import SakinGirisiYonet from "@/components/daireler/SakinGirisiYonet";
import GuncellemeTalebiKart from "@/components/daireler/GuncellemeTalebiKart";

interface BlokLean {
  ad: string;
}
interface AidatGrubuLean {
  ad: string;
}
interface EkOdenekLean {
  ad: string;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const dateFmt = (d: Date) => d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

const DURUM_STYLE: Record<string, string> = {
  Odendi: "bg-success-bg text-success-fg",
  Bekliyor: "bg-warning-bg text-warning-fg",
  Gecikti: "bg-danger-bg text-danger-fg",
};
const DURUM_LABEL: Record<string, string> = { Odendi: "Ödendi", Bekliyor: "Bekliyor", Gecikti: "Gecikti" };

export default async function DaireDetayPage({
  params,
}: {
  params: Promise<{ daireId: string }>;
}) {
  const session = await requirePageSession();
  const { daireId } = await params;
  const siteId = session.siteId as string;

  await senkronizeGecikenDurumlar(siteId);
  await connectDB();

  const daire = await Daire.findOne({ _id: daireId, siteId })
    .populate<{ blokId: BlokLean }>("blokId", "ad")
    .populate<{ aidatGrubuId: AidatGrubuLean }>("aidatGrubuId", "ad")
    .lean();

  if (!daire) notFound();

  const [aidatKayitlari, ekBorclar, bekleyenTalep, sakinUser, site] = await Promise.all([
    AidatKaydi.find({ siteId, daireId }).sort({ donem: -1 }).lean(),
    EkOdenekBorcu.find({ siteId, daireId }).populate<{ ekOdenekId: EkOdenekLean }>("ekOdenekId", "ad").lean(),
    SakinGuncellemeTalebi.findOne({ siteId, daireId, durum: "Bekliyor" }).lean(),
    User.findOne({ siteId, daireId, rol: "site_sakini", aktif: true }).lean(),
    Site.findById(siteId).lean(),
  ]);

  const faizPolitikasi = site?.faizPolitikasi ?? { faizBaslangicGunSayisi: 0, gunlukFaizOraniYuzde: 0 };
  const aktifSakin = daire.sakinler.find((s) => s.aktif);
  const gecmisSakinler = daire.sakinler.filter((s) => !s.aktif);

  const borcGecmisi = [
    ...aidatKayitlari.map((k) => ({
      id: String(k._id),
      donem: k.donem,
      not: k.durum === "Odendi" && k.odemeTarihi ? `${dateFmt(k.odemeTarihi)} ödendi` : "Aidat",
      tutar: k.birimTutar + efektifFaiz(k, faizPolitikasi),
      durum: k.durum,
    })),
    ...ekBorclar.map((b) => ({
      id: String(b._id),
      donem: b.ekOdenekId?.ad ?? "Ek Ödenek",
      not: `Son ödeme ${dateFmt(b.sonOdemeTarihi)}`,
      tutar: b.tutar + efektifFaiz(b, faizPolitikasi),
      durum: b.durum,
    })),
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/daireler" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft mb-4">
        ← Daire listesine dön
      </Link>

      <div className="bg-white border border-card-border rounded-2xl p-6 mb-4.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF3FF] text-accent flex items-center justify-center text-lg font-extrabold">
            {daire.blokId?.ad}-{daire.daireNo}
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight">{aktifSakin?.adSoyad ?? "Sakin yok"}</div>
            <div className="text-sm text-ink-soft font-semibold">
              {aktifSakin ? (aktifSakin.tur === "EvSahibi" ? "Ev Sahibi" : "Kiracı") : "—"} ·{" "}
              {daire.aidatGrubuId?.ad} aidat grubu
            </div>
          </div>
        </div>
        <SakinDegistirButton daireId={daireId} />
      </div>

      {bekleyenTalep && (
        <div className="mb-4.5">
          <GuncellemeTalebiKart talepId={String(bekleyenTalep._id)} alanlar={bekleyenTalep.talepEdilenAlanlar} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mb-4.5">
        <div className="bg-white border border-card-border rounded-2xl p-5.5">
          <div className="text-sm font-bold mb-4">İletişim &amp; Araç</div>
          <Row label="Telefon" value={aktifSakin?.telefon1 || "—"} />
          <Row label="E-posta" value={aktifSakin?.eposta || "—"} />
          <Row label="Araç Plakası" value={aktifSakin?.plakalar[0] || "—"} />
          <Row label="Sakin Türü" value={aktifSakin ? (aktifSakin.tur === "EvSahibi" ? "Ev Sahibi" : "Kiracı") : "—"} last />
        </div>
        <div className="bg-white border border-card-border rounded-2xl p-5.5">
          <div className="text-sm font-bold mb-4">Aidat / Borç Geçmişi</div>
          {borcGecmisi.length === 0 ? (
            <p className="text-sm text-ink-soft">Henüz tahakkuk oluşturulmadı.</p>
          ) : (
            <div className="flex flex-col">
              {borcGecmisi.map((b, i) => (
                <div key={b.id} className={`flex justify-between items-center py-2.5 ${i === 0 ? "" : "border-t border-bg"}`}>
                  <div>
                    <div className="text-sm font-semibold">{b.donem}</div>
                    <div className="text-xs text-ink-faint">{b.not}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold">{fmt.format(b.tutar)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${DURUM_STYLE[b.durum]}`}>{DURUM_LABEL[b.durum]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4.5">
        <SakinGirisiYonet daireId={daireId} mevcutKullaniciAdi={sakinUser?.kullaniciAdi ?? null} />
      </div>

      {gecmisSakinler.length > 0 && (
        <div className="bg-white border border-card-border rounded-2xl p-5.5">
          <div className="text-sm font-bold mb-3">Geçmiş Sakinler</div>
          {gecmisSakinler.map((s, i) => (
            <div key={i} className={`flex justify-between py-2 text-sm ${i === 0 ? "" : "border-t border-bg"}`}>
              <span className="font-semibold">{s.adSoyad}</span>
              <span className="text-ink-faint">{s.tur === "EvSahibi" ? "Ev Sahibi" : "Kiracı"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 text-sm ${last ? "" : "border-b border-bg"}`}>
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
