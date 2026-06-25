import Link from "next/link";
import { requirePageSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboardData";

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const dateFmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

export default async function DashboardPage() {
  const session = await requirePageSession();
  const data = await getDashboardData(session.siteId as string);

  const bmax = Math.max(1, ...data.aylikGelirGider.flatMap((a) => [a.gelir, a.gider]));

  let acc = 0;
  const segments = data.giderDagilimi.map((g) => {
    const start = (acc / data.giderToplam) * 360;
    acc += g.tutar;
    const end = (acc / data.giderToplam) * 360;
    return `${g.renk} ${start}deg ${end}deg`;
  });
  const donutStyle =
    data.giderToplam > 0
      ? {
          background: `conic-gradient(${segments.join(",")})`,
          WebkitMask: "radial-gradient(circle, transparent 40px, #000 41px)",
          mask: "radial-gradient(circle, transparent 40px, #000 41px)",
        }
      : { background: "#EEF1F6" };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4.5 mb-5">
        <KpiCard label="Ana Kasa Toplamı" value={fmt.format(data.anaKasaToplami)} />
        <KpiCard label="Tahsil Edilen Aidat" value={fmt.format(data.tahsilEdilenAidat)} sub={`${data.odendiSayisi}/${data.toplamDaire} daire ödedi`} />
        <KpiCard
          label="Bekleyen Tahsilat"
          value={fmt.format(data.bekleyenTahsilat)}
          sub={`${data.geciktiSayisi} gecikmiş · faiz işliyor`}
          subClass="text-danger-fg"
        />
        <div className="bg-white border border-card-border rounded-2xl px-5 py-4.5">
          <div className="text-xs font-bold text-ink-soft mb-1.5">Tahsilat Oranı</div>
          <div className="text-2xl font-extrabold">%{data.tahsilatOrani}</div>
          <div className="h-1.5 rounded bg-bg mt-2.5 overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${data.tahsilatOrani}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4.5">
        <div className="flex flex-col gap-4.5">
          <div className="bg-white border border-card-border rounded-2xl p-5.5">
            <div className="flex justify-between items-center mb-5.5">
              <div>
                <div className="text-sm font-bold">Gelir / Gider — Son 6 Ay</div>
                <div className="text-xs text-ink-faint">Tüm kasalar</div>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Gelir
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D7E0F5] inline-block" /> Gider
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between h-[170px] gap-2">
              {data.aylikGelirGider.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex items-end gap-1">
                    <div className="w-3.5 rounded-t bg-accent" style={{ height: `${Math.round((b.gelir / bmax) * 150)}px` }} />
                    <div className="w-3.5 rounded-t bg-[#D7E0F5]" style={{ height: `${Math.round((b.gider / bmax) * 150)}px` }} />
                  </div>
                  <div className="text-xs font-semibold text-ink-faint">{b.ay}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-card-border rounded-2xl">
            <div className="flex justify-between items-center px-5.5 py-4.5 border-b border-[#F0F2F7]">
              <div className="text-sm font-bold">Son Hareketler</div>
              <Link href="/finans" className="text-sm font-bold text-accent">
                Tümünü gör →
              </Link>
            </div>
            {data.sonHareketler.length === 0 ? (
              <div className="px-5.5 py-8 text-center text-sm text-ink-soft">Henüz kasa hareketi yok.</div>
            ) : (
              data.sonHareketler.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3.5 px-5.5 py-3.5 ${i === 0 ? "" : "border-t border-[#F6F7FA]"}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-none ${t.tip === "Gelir" ? "bg-success-dot" : "bg-danger-dot"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{t.aciklama}</div>
                    <div className="text-xs text-ink-faint">
                      {dateFmt(t.tarih)} · {t.kasaAd}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-ink-soft bg-bg px-2.5 py-1 rounded-lg">{t.kategori}</div>
                  <div className={`text-sm font-bold ${t.tip === "Gelir" ? "text-success-fg" : "text-ink"}`}>
                    {t.tip === "Gelir" ? "+ " : "– "}
                    {fmt.format(t.tutar)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4.5">
          <div className="bg-white border border-card-border rounded-2xl p-5.5">
            <div className="text-sm font-bold mb-4.5">Aidat Tahsilat Durumu</div>
            <div className="flex flex-col gap-3">
              <DurumBar label="Ödendi" sayi={data.odendiSayisi} toplam={data.toplamDaire} renk="bg-success-dot" />
              <DurumBar label="Bekliyor" sayi={data.bekliyorSayisi} toplam={data.toplamDaire} renk="bg-warning-dot" />
              <DurumBar label="Gecikti" sayi={data.geciktiSayisi} toplam={data.toplamDaire} renk="bg-danger-dot" />
            </div>
          </div>

          <div className="bg-white border border-card-border rounded-2xl p-5.5">
            <div className="text-sm font-bold mb-4.5">Gider Dağılımı</div>
            {data.giderDagilimi.length === 0 ? (
              <p className="text-sm text-ink-soft">Henüz gider kaydı yok.</p>
            ) : (
              <div className="flex items-center gap-5">
                <div className="relative flex-none w-[124px] h-[124px]">
                  <div className="w-full h-full rounded-full" style={donutStyle} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10.5px] text-ink-faint font-semibold">Toplam</div>
                    <div className="text-sm font-extrabold">{fmt.format(data.giderToplam)}</div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {data.giderDagilimi.map((g) => (
                    <div key={g.kategori} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: g.renk }} />
                      <span className="flex-1 text-[#3C4660] font-semibold">{g.kategori}</span>
                      <span className="font-bold text-ink-faint">%{g.yuzde}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, subClass }: { label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="bg-white border border-card-border rounded-2xl px-5 py-4.5">
      <div className="text-xs font-bold text-ink-soft mb-1.5">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      {sub && <div className={`text-xs font-semibold mt-1.5 ${subClass ?? "text-ink-faint"}`}>{sub}</div>}
    </div>
  );
}

function DurumBar({ label, sayi, toplam, renk }: { label: string; sayi: number; toplam: number; renk: string }) {
  const yuzde = toplam > 0 ? Math.round((sayi / toplam) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-semibold text-[#3C4660]">{label}</span>
        <span className="font-bold">{sayi} daire</span>
      </div>
      <div className="h-1.5 rounded bg-bg overflow-hidden">
        <div className={`h-full rounded ${renk}`} style={{ width: `${yuzde}%` }} />
      </div>
    </div>
  );
}
