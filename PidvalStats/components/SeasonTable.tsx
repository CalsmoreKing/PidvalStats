"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";

type Row = {
  id: string;
  full_name: string;
};

// "Сирі" компоненти по кожному турніру окремо — щоб можна було коректно
// підсумувати зважений (на хвилини) рейтинг для БУДЬ-ЯКОЇ комбінації
// обраних турнірів, а не лише для одного за раз.
type CompRow = {
  id: string;
  competitionSlug: string;
  matches: number;
  goals: number;
  penaltyGoals: number;
  assists: number;
  votes: number;
  minutes: number;
  weightedSum: number;
  minutesSum: number;
};

type SortKey = "matches" | "goals" | "assists" | "votes" | "minutes" | "season_rating";

const columns: { key: SortKey; label: string }[] = [
  { key: "matches", label: "Матчі" },
  { key: "minutes", label: "Хвилини" },
  { key: "goals", label: "Голи" },
  { key: "assists", label: "Асисти" },
  { key: "votes", label: "Голоси" },
  { key: "season_rating", label: "Рейтинг" },
];

export default function SeasonTable({
  rows,
  byCompetition,
  competitions,
}: {
  rows: Row[];
  byCompetition: CompRow[];
  competitions: { id: string; slug: string; name: string }[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("season_rating");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allSlugs = useMemo(() => competitions.map((c) => c.slug), [competitions]);
  // За замовчуванням товариські ВИМКНЕНІ — вони давно закінчились і лише
  // спотворюють статистику дублерів, викликаних на одну товариську гру.
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(allSlugs.filter((s) => s !== "friendly"))
  );
  const allChecked = allSlugs.length > 0 && allSlugs.every((s) => checked.has(s));

  function toggleComp(slug: string) {
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const namesById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.id, r.full_name);
    return m;
  }, [rows]);

  // Підсумовуємо обрані турніри для кожного гравця — зважений рейтинг
  // рахується тут же, з тих самих "сирих" сум, що й в основній season_stats
  // view, тож "усі обрано" завжди математично збігається з нею.
  const displayRows = useMemo(() => {
    const acc = new Map<
      string,
      {
        matches: number;
        goals: number;
        penaltyGoals: number;
        assists: number;
        votes: number;
        minutes: number;
        weightedSum: number;
        minutesSum: number;
      }
    >();
    for (const r of byCompetition) {
      if (!checked.has(r.competitionSlug)) continue;
      const cur =
        acc.get(r.id) ??
        { matches: 0, goals: 0, penaltyGoals: 0, assists: 0, votes: 0, minutes: 0, weightedSum: 0, minutesSum: 0 };
      cur.matches += r.matches;
      cur.goals += r.goals;
      cur.penaltyGoals += r.penaltyGoals;
      cur.assists += r.assists;
      cur.votes += r.votes;
      cur.minutes += r.minutes;
      cur.weightedSum += r.weightedSum;
      cur.minutesSum += r.minutesSum;
      acc.set(r.id, cur);
    }
    return Array.from(acc.entries())
      .map(([id, v]) => ({
        id,
        full_name: namesById.get(id) ?? "",
        matches: v.matches,
        goals: v.goals,
        penaltyGoals: v.penaltyGoals,
        assists: v.assists,
        votes: v.votes,
        minutes: v.minutes,
        season_rating: v.minutesSum > 0 ? Math.round((v.weightedSum / v.minutesSum) * 10) / 10 : null,
      }))
      .filter((r) => r.full_name);
  }, [byCompetition, checked, namesById]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...displayRows];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
    return copy;
  }, [displayRows, sortKey, sortDir]);

  return (
    <div>
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setChecked(new Set(allSlugs))}
          className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
            allChecked
              ? "bg-panel-raised border-gold/40 text-gold-bright"
              : "border-white/10 text-muted hover:border-white/25"
          }`}
          title="Обрати всі турніри, включно з товариськими"
        >
          Всі
        </button>
        {competitions
          .filter((c) => c.slug !== "friendly")
          .map((c) => {
            const on = checked.has(c.slug);
            return (
              <button
                key={c.id}
                onClick={() => toggleComp(c.slug)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
                  on
                    ? "bg-panel-raised border-gold/40 text-gold-bright"
                    : "border-white/10 text-muted hover:border-white/25"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        {competitions
          .filter((c) => c.slug === "friendly")
          .map((c) => {
            const on = checked.has(c.slug);
            return (
              <button
                key={c.id}
                onClick={() => toggleComp(c.slug)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
                  on
                    ? "bg-panel-raised border-gold/40 text-gold-bright"
                    : "border-white/10 text-muted hover:border-white/25"
                }`}
              >
                {c.name}
              </button>
            );
          })}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-panel-raised text-muted eyebrow text-left">
              <th className="px-5 py-3 font-normal">#</th>
              <th className="px-5 py-3 font-normal">Гравець</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-5 py-3 font-normal text-right cursor-pointer select-none hover:text-gold-bright transition-colors duration-150"
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === "desc" ? " ↓" : " ↑")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-6 text-center text-muted">
                  {checked.size === 0 ? "Обери хоча б один турнір." : "Немає даних для обраних турнірів."}
                </td>
              </tr>
            )}
            {sorted.map((p, i) => {
              const rc = p.season_rating != null ? ratingColor(p.season_rating) : null;
              return (
                <tr key={p.id} className="bg-panel/80 hover:bg-transparent transition-colors duration-150">
                  <td className="px-5 py-4 font-display text-gold/50">{i + 1}</td>
                  <td className="px-5 py-4 text-ivory">
                    <Link href={`/players/${p.id}`} className="hover:text-gold-bright">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.matches}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.minutes}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">
                    {p.goals}
                    {p.penaltyGoals > 0 && <span className="text-[10px] text-muted/60"> ({p.penaltyGoals})</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.assists}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.votes}</td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className="rating-star inline-flex h-9 w-9 items-center justify-center font-utility text-xs font-bold"
                      style={rc ? { background: rc.bg, color: rc.text } : undefined}
                    >
                      {p.season_rating?.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
