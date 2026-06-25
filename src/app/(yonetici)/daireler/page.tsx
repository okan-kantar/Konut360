import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import Blok, { type IBlok } from "@/models/Blok";
import Daire from "@/models/Daire";
import AidatGrubu from "@/models/AidatGrubu";
import { requirePageSession } from "@/lib/auth/session";
import DaireEkleButton from "@/components/daireler/DaireEkleButton";

interface BlokLean {
  ad: string;
}

export default async function DairelerPage({
  searchParams,
}: {
  searchParams: Promise<{ blok?: string; q?: string }>;
}) {
  const session = await requirePageSession();
  const { blok, q } = await searchParams;
  const aramaMetni = q?.trim().toLowerCase() ?? "";
  await connectDB();

  const bloklar = await Blok.find({ siteId: session.siteId }).sort({ ad: 1 }).lean<IBlok[]>();
  const filter: Record<string, unknown> = { siteId: session.siteId };
  if (blok) filter.blokId = blok;

  const [tumDaireler, aidatGruplari] = await Promise.all([
    Daire.find(filter).sort({ daireNo: 1 }).populate<{ blokId: BlokLean }>("blokId", "ad").lean(),
    AidatGrubu.find({ siteId: session.siteId }).sort({ ad: 1 }).lean(),
  ]);

  const daireler = aramaMetni
    ? tumDaireler.filter((d) => {
        const aktifSakin = d.sakinler.find((s) => s.aktif);
        const blokAd = (d.blokId?.ad ?? "").toLowerCase();
        const daireNo = d.daireNo.toLowerCase();
        const sakinAd = (aktifSakin?.adSoyad ?? "").toLowerCase();
        return (
          `${blokAd}-${daireNo}`.includes(aramaMetni) ||
          daireNo.includes(aramaMetni) ||
          sakinAd.includes(aramaMetni)
        );
      })
    : tumDaireler;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3.5">
        <div className="flex gap-2 flex-wrap items-center">
          <BlokChip label="Tümü" active={!blok && !aramaMetni} href="/daireler" />
          {bloklar.map((b) => (
            <BlokChip
              key={String(b._id)}
              label={`${b.ad} Blok`}
              active={blok === String(b._id) && !aramaMetni}
              href={`/daireler?blok=${b._id}`}
            />
          ))}
          {aramaMetni && (
            <span className="text-xs font-semibold text-ink-soft ml-1">
              &ldquo;{q}&rdquo; için {daireler.length} sonuç
            </span>
          )}
        </div>
        <DaireEkleButton
          bloklar={bloklar.map((b) => ({ id: String(b._id), ad: b.ad }))}
          aidatGruplari={aidatGruplari.map((g) => ({ id: String(g._id), ad: g.ad }))}
        />
      </div>

      <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FAFBFD]">
              <th className="text-left px-6 py-3 text-xs font-bold text-ink-faint uppercase">Daire</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Sakin</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Tür</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">İletişim</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-faint uppercase">Plaka</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {daireler.map((d, i) => {
              const sakin = d.sakinler.find((s) => s.aktif);
              return (
                <tr key={String(d._id)} className={i === 0 ? "" : "border-t border-[#F0F2F7]"}>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 rounded-lg bg-[#EEF3FF] text-accent text-xs font-extrabold">
                      {d.blokId?.ad}-{d.daireNo}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold">{sakin?.adSoyad ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    {sakin && (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          sakin.tur === "EvSahibi" ? "bg-[#EEF3FF] text-accent" : "bg-[#FBF1E7] text-[#B7791F]"
                        }`}
                      >
                        {sakin.tur === "EvSahibi" ? "Ev Sahibi" : "Kiracı"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{sakin?.telefon1 ?? "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-ink-soft font-semibold">{sakin?.plakalar[0] ?? "—"}</td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/daireler/${d._id}`}
                      className="px-3 py-1.5 border border-card-border rounded-lg text-xs font-bold"
                    >
                      Detay →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {daireler.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-soft">
                  {aramaMetni ? `"${q}" ile eşleşen daire veya sakin bulunamadı.` : "Bu blokta henüz daire yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlokChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-2 rounded-lg border text-sm font-bold ${
        active ? "bg-accent border-accent text-white" : "border-card-border text-[#3C4660] bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
