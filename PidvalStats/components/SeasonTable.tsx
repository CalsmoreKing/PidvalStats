"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";

type Row = {
  id: string;
  full_name: string;
  matches: number;
  goals: number;
  assists: number;
  votes: number;
  season_rating: number | null | undefined;
};

type CompRow = { id: string; competitionSlug: string; matches: number; season_rating: number | null };

type SortKey = "matches" | "goals" | "assists" | "votes" | "season_rating";

const columns: { key: SortKey; label: string }[] = [
  { key: "matches", label: "Матчі" },
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
  const [activeSlug, setActiveSlug] = useState<string | null>(null); // null = "Всі"

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const displayRows = useMemo(() => {
    if (!activeSlug) return rows;
    // У межах турніру показуємо тільки гравців, які в ньому грали,
    // з їх рейтингом і матчами саме в цьому турнірі (голи/асисти/голоси —
    // загальні за сезон, view їх окремо по турнірах не рахує).
    return rows
      .map((r) => {
        const comp = byCompetition.find((c) => c.id === r.id && c.competitionSlug === activeSlug);
        if (!comp) return null;
        return { ...r, matches: comp.matches, season_rating: comp.season_rating };
      })
      .filter(Boolean) as Row[];
  }, [rows, byCompetition, activeSlug]);

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
          onClick={() => setActiveSlug(null)}
          className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
            activeSlug === null
              ? "bg-panel-raised border-gold/40 text-gold-bright"
              : "border-white/10 text-muted hover:border-white/25"
          }`}
        >
          Всі
        </button>
        {competitions.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveSlug(c.slug)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
              activeSlug === c.slug
                ? "bg-panel-raised border-gold/40 text-gold-bright"
                : "border-white/10 text-muted hover:border-white/25"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
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
                <td colSpan={7} className="px-5 py-6 text-center text-muted">
                  Немає даних для цього турніру.
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
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.goals}</td>
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
