import { SpecialNomination, fmt2 } from "@/lib/award";

export default function SpecialNominations({ items }: { items: SpecialNomination[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl text-champagne text-center">Спеціальні номінації</h2>
      <p className="text-sm text-muted text-center mt-1 mb-6">Їх уже вручено — за вчинки, яких не видно в загальному заліку.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => {
          const head = it.stats.slice(0, 4);
          const more = it.stats.slice(4);
          return (
            <article key={it.id} className="gold-frame rounded-2xl p-5 flex flex-col gap-4 hover:border-gold/60 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-[#fff1b0] via-[#d4af37] to-[#7a5a12] flex items-center justify-center text-2xl shadow-[0_6px_18px_rgba(212,175,55,0.3)]">
                  <span aria-hidden>{it.emoji}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base md:text-lg text-gold-bright leading-tight">«{it.title}»</h3>
                  <div className="font-display text-xl md:text-2xl text-ivory leading-tight mt-1 break-words">{it.winner_name}</div>
                </div>
              </div>
              {it.stat_score != null && (
                <div className="flex items-baseline gap-2">
                  <span className="gold-text font-display font-black text-4xl leading-none">{fmt2(it.stat_score)}</span>
                  <span className="text-xs text-muted">/ 100 статистичний бал</span>
                </div>
              )}
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
                {head.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-utility text-ivory text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              {more.length > 0 && (
                <details className="group -mt-2">
                  <summary className="cursor-pointer list-none text-xs text-gold-bright/80 hover:text-gold-bright">
                    <span className="group-open:hidden">Ще {more.length} показників ▾</span>
                    <span className="hidden group-open:inline">Сховати ▴</span>
                  </summary>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs mt-2">
                    {more.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted">{k}</dt>
                        <dd className="font-utility text-ivory text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
