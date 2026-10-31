import { Standing, fmt1, fmt2 } from "@/lib/award";

const MEDAL = [
  { ring: "from-[#fff1b0] via-[#f3cc5c] to-[#b88a1c]", label: "text-void", h: "md:h-44" },
  { ring: "from-[#f1f1f4] via-[#c9cbd4] to-[#8b8e9c]", label: "text-void", h: "md:h-32" },
  { ring: "from-[#f0c79a] via-[#c98a4e] to-[#8a5426]", label: "text-void", h: "md:h-24" },
];

// Церемонія: переможець, подіум і повна таблиця зі складовими підсумку.
export default function AwardResults({
  standings,
  totalMatches,
  wb,
  wv,
  wa,
}: {
  standings: Standing[];
  totalMatches: number;
  wb: number;
  wv: number;
  wa: number;
}) {
  const [w, s2, s3] = standings;
  if (!w) return null;
  // порядок подіуму: 2 · 1 · 3
  const podium = [
    { s: s2, i: 1 },
    { s: w, i: 0 },
    { s: s3, i: 2 },
  ].filter((x) => x.s);

  return (
    <section className="flex flex-col gap-8">
      <div className="gold-stage gold-frame rounded-3xl text-center px-5 py-9 md:py-12 relative overflow-hidden">
        <div className="text-champagne text-sm md:text-base">Переможець «Підвал д&apos;Ор»</div>
        <div className="gold-text font-display font-black text-4xl sm:text-5xl md:text-7xl leading-tight mt-2 break-words px-2">
          {w.nominee.name}
        </div>
        <div className="gold-rule mx-auto my-5 max-w-xs" />
        <div className="font-utility text-sm text-gold-soft">
          {fmt2(w.total)} <span className="text-muted">балів</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 items-end max-w-3xl mx-auto w-full">
        {podium.map(({ s, i }) => (
          <div key={s.nominee.id} className="flex flex-col items-center text-center min-w-0">
            <div className={`h-12 w-12 md:h-16 md:w-16 rounded-full bg-gradient-to-br ${MEDAL[i].ring} flex items-center justify-center font-display font-black text-xl md:text-3xl text-void shadow-[0_6px_18px_rgba(0,0,0,0.5)]`}>
              {i + 1}
            </div>
            <div className="mt-2 text-xs md:text-sm text-ivory leading-tight break-words max-w-full px-1">{s.nominee.name}</div>
            <div className="font-utility text-[11px] md:text-sm text-gold-bright mt-0.5">{fmt2(s.total)}</div>
            <div className={`mt-2 w-full rounded-t-xl bg-gradient-to-b ${MEDAL[i].ring} opacity-90 ${i === 0 ? "h-20" : i === 1 ? "h-14" : "h-10"} ${MEDAL[i].h}`} />
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-2xl md:text-3xl text-champagne mb-4 text-center">Підсумкова таблиця</h2>

        <div className="hidden md:block gold-frame rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs text-left border-b border-gold/20">
                <th className="px-4 py-3 font-normal w-10">#</th>
                <th className="px-3 py-3 font-normal">Учасник</th>
                <th className="px-3 py-3 font-normal text-right">Статистика <span className="text-muted/60">×{fmt1(wb)}</span></th>
                <th className="px-3 py-3 font-normal text-right">Голосування <span className="text-muted/60">×{fmt1(wv)}</span></th>
                <th className="px-3 py-3 font-normal text-right">Активність на сайті <span className="text-muted/60">×{fmt1(wa)}</span></th>
                <th className="px-5 py-3 font-normal text-right text-gold-soft">Разом</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.nominee.id} className={`border-t border-white/5 ${i === 0 ? "bg-gold/10" : ""}`}>
                  <td className="px-4 py-3 font-display text-gold/60">{i + 1}</td>
                  <td className="px-3 py-3 text-ivory">{s.nominee.name}</td>
                  <td className="px-3 py-3 text-right font-utility text-muted">
                    {fmt2(s.statPart)}
                    <div className="text-[10px] text-muted/60">{fmt1(s.statScore)} зі 100</div>
                  </td>
                  <td className="px-3 py-3 text-right font-utility text-muted">
                    {fmt2(s.votePart)}
                    <div className="text-[10px] text-muted/60">{s.votePoints} б. · {s.firstPlaces}×1 місце</div>
                  </td>
                  <td className="px-3 py-3 text-right font-utility text-muted">
                    {fmt2(s.sitePart)}
                    <div className="text-[10px] text-muted/60">{s.siteDone} із {totalMatches} матчів</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="gold-text font-display font-black text-2xl lg:text-3xl">{fmt2(s.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-2">
          {standings.map((s, i) => (
            <div key={s.nominee.id} className={`gold-frame rounded-xl px-4 py-3 ${i === 0 ? "ring-1 ring-gold/60" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="font-display text-gold/60 w-6 shrink-0">{i + 1}</span>
                <span className="text-ivory text-sm flex-1 min-w-0 break-words">{s.nominee.name}</span>
                <span className="gold-text font-display font-black text-2xl shrink-0">{fmt2(s.total)}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted">
                <div>Статистика<div className="font-utility text-xs text-ivory">{fmt2(s.statPart)}</div></div>
                <div>Голосування<div className="font-utility text-xs text-ivory">{fmt2(s.votePart)}</div></div>
                <div>На сайті<div className="font-utility text-xs text-ivory">{fmt2(s.sitePart)}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
