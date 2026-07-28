"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  full_name: string;
  matches: number;
  goals: number;
  assists: number;
  votes: number;
  season_rating: number | null | undefined;
};

type SortKey = "matches" | "goals" | "assists" | "votes" | "season_rating";

const columns: { key: SortKey; label: string }[] = [
  { key: "matches", label: "Матчі" },
  { key: "goals", label: "Голи" },
  { key: "assists", label: "Асисти" },
  { key: "votes", label: "Голоси" },
  { key: "season_rating", label: "Рейтинг" },
];

const competitionTabs = ["Всі", "Ла Ліга", "Кубок Іспанії", "Ліга чемпіонів", "Товариські"];

export default function SeasonTable({ rows }: { rows: Row[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("season_rating");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("Всі");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {competitionTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              activeTab === tab
                ? "bg-panel-raised border-gold/40 text-gold-bright"
                : "border-white/10 text-muted hover:border-white/25"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* TODO: коли підключимо season_stats_by_competition — activeTab фільтруватиме рядки по турніру */}

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
                  className="px-5 py-3 font-normal text-right cursor-pointer select-none hover:text-gold-bright transition-colors"
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === "desc" ? " ↓" : " ↑")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((p, i) => (
              <tr key={p.id} className="bg-panel/80 hover:bg-transparent transition-colors">
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
                  <span className="rating-star inline-flex h-9 w-9 items-center justify-center font-utility text-xs font-bold">
                    {p.season_rating?.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
