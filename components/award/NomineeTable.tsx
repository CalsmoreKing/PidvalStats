"use client";

import { Fragment, useState } from "react";
import { Nominee, STAT_CATEGORIES, fmt1, fmt2 } from "@/lib/award";

const CAT_SHORT: Record<string, string> = { activity: "Активність", impact: "Вплив", dialog: "Діалог", content: "Контент", quality: "Якість" };

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
      <div className="gold-bar h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function Details({ n }: { n: Nominee }) {
  const st = n.stats;
  if (!st) return <p className="text-xs text-muted">Детальної статистики немає.</p>;
  const r = st.raw;
  const raw: [string, string][] = [
    ["Повідомлень", r.messages.toLocaleString("uk-UA")],
    ["Активних днів", `${r.days} із 366`],
    ["Символів тексту", r.chars.toLocaleString("uk-UA")],
    ["Відповідей отримано", r.replies_received.toLocaleString("uk-UA")],
    ["Різних людей відповідало", String(r.repliers)],
    ["Реакцій отримано", r.reactions.toLocaleString("uk-UA")],
    ["Відповідей надано", r.replies_given.toLocaleString("uk-UA")],
    ["Різним людям відповідав", String(r.talked_to)],
    ["Середня довжина", `${fmt1(r.avg_len)} симв.`],
    ["Повідомлень 200+ символів", String(r.long_msgs)],
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {STAT_CATEGORIES.map((c) => {
          const cat: any = (st.cats as any)[c.key];
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-ivory">{c.label}</span>
                <span className="font-utility text-gold-bright">
                  {fmt1(cat.total)} <span className="text-muted">/ {c.max}</span>
                </span>
              </div>
              <Bar value={cat.total} max={c.max} />
              <div className="mt-1.5 flex flex-col gap-0.5">
                {c.parts.map(([k, label, max]) => (
                  <div key={k} className="flex justify-between text-[11px] text-muted">
                    <span>{label}</span>
                    <span className="font-utility">
                      {fmt1(cat[k])}/{max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 content-start text-xs">
        {raw.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-utility text-ivory">{v}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

// Статистика номінантів: категорії + головний сумарний бал завжди в правій колонці.
export default function NomineeTable({
  nominees,
  siteDone,
  totalMatches,
}: {
  nominees: Nominee[];
  siteDone: Record<string, number | null>; // id номінанта → скільки матчів повністю оцінив (null — акаунт не прив'язано)
  totalMatches: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const sitePct = (id: string) => {
    const d = siteDone[id];
    return d == null || totalMatches === 0 ? null : Math.min(100, (d / totalMatches) * 100);
  };
  const sorted = [...nominees].sort((a, b) => b.base_points - a.base_points);

  return (
    <div>
      {/* Десктоп — таблиця */}
      <div className="hidden xl:block gold-frame rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted/70 border-b border-white/5">
              <th colSpan={2} />
              <th className="px-3 pt-3 pb-1 font-normal text-center">Сайт</th>
              <th colSpan={STAT_CATEGORIES.length} className="px-3 pt-3 pb-1 font-normal text-center text-gold-soft/80">
                <span className="gold-rule inline-block w-8 align-middle mr-2" />
                Статистика чату
                <span className="gold-rule inline-block w-8 align-middle ml-2" />
              </th>
              <th />
            </tr>
            <tr className="text-muted text-xs text-left border-b border-gold/20">
              <th className="px-3 py-3 font-normal w-8">#</th>
              <th className="px-2 py-3 font-normal">Учасник</th>
              <th className="px-2 py-3 font-normal text-right leading-tight w-[92px]">Активність на сайті</th>
              {STAT_CATEGORIES.map((c) => (
                <th key={c.key} className="px-2 py-3 font-normal text-right leading-tight">
                  {c.label}<div className="text-muted/60 text-[10px]">із {c.max}</div>
                </th>
              ))}
              <th className="px-4 py-3 font-normal text-right text-[#F3CC5C] leading-tight w-[120px]">Статистичний бал<div className="text-[10px] text-[#F3CC5C]/60">із 100</div></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((n, i) => {
              const isOpen = open === n.id;
              return (
                <Fragment key={n.id}>
                  <tr
                    onClick={() => setOpen(isOpen ? null : n.id)}
                    className="cursor-pointer border-t border-white/5 hover:bg-gold/5 transition-colors duration-150"
                  >
                    <td className="px-3 py-3 font-display text-gold/60">{i + 1}</td>
                    <td className="px-2 py-3 text-ivory break-words max-w-[180px]">
                      {n.name}
                      <span className={`ml-2 text-gold-bright/70 text-xs inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      {sitePct(n.id) == null ? (
                        <span className="text-muted/50 text-xs" title="Акаунт ще не прив'язано або на сайті немає оцінок">—</span>
                      ) : (
                        <>
                          <div className="font-utility text-muted text-xs">{fmt1(sitePct(n.id)!)}%</div>
                          <div className="text-[10px] text-muted/60">{siteDone[n.id]} із {totalMatches}</div>
                        </>
                      )}
                    </td>
                    {STAT_CATEGORIES.map((c) => {
                      const v = n.stats ? (n.stats.cats as any)[c.key].total : null;
                      return (
                        <td key={c.key} className="px-2 py-3 text-right">
                          {v != null && (
                            <>
                              <div className="font-utility text-muted text-xs">{fmt1(v)}</div>
                              <div className="mt-1 ml-auto w-12"><Bar value={v} max={c.max} /></div>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <span className="gold-solid font-display font-black text-3xl lg:text-4xl tabular-nums">{fmt2(n.base_points)}</span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-black/20">
                      <td colSpan={9} className="px-6 py-5"><Details n={n} /></td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Телефон — картки */}
      <div className="xl:hidden flex flex-col gap-2">
        {sorted.map((n, i) => {
          const isOpen = open === n.id;
          return (
            <div key={n.id} className="gold-frame rounded-xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : n.id)} className="w-full text-left px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-gold/60 w-6 shrink-0">{i + 1}</span>
                  <span className="text-ivory text-sm flex-1 min-w-0 break-words">{n.name}</span>
                  <span className="gold-solid font-display font-black text-3xl shrink-0 tabular-nums">{fmt2(n.base_points)}</span>
                </div>
                <div className="mt-1 pl-9 text-[11px] text-muted">
                  Активність на сайті:{" "}
                  <span className="font-utility text-ivory/80">
                    {sitePct(n.id) == null ? "—" : `${fmt1(sitePct(n.id)!)}% (${siteDone[n.id]} із ${totalMatches})`}
                  </span>
                </div>
                {n.stats && (
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {STAT_CATEGORIES.map((c) => (
                      <div key={c.key}>
                        <div className="text-[9px] text-muted truncate">{CAT_SHORT[c.key]}</div>
                        <Bar value={(n.stats!.cats as any)[c.key].total} max={c.max} />
                      </div>
                    ))}
                  </div>
                )}
              </button>
              {isOpen && <div className="px-4 pb-4 pt-1 border-t border-white/5"><Details n={n} /></div>}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted mt-2">Натисни на учасника, щоб побачити всі показники.</p>
    </div>
  );
}
