"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";
import { POSITION_GROUPS, PositionGroup, positionGroup } from "@/lib/positions";

// Один рядок = гравець в одному матчі (view season_player_matches). Усі
// фільтри (турнір, місяць, позиція, старт/заміна) рахуються тут, з сирих
// цифр, тож будь-яка комбінація дає точні підсумки — без окремої view під
// кожен фільтр.
export type MatchRow = {
  id: string; // player id
  fullName: string;
  position: string | null;
  competitionSlug: string;
  month: string; // "2026-09"
  isStarting: boolean;
  minutes: number;
  goals: number; // УСЬОГО голів (разом з пенальті)
  penaltyGoals: number; // скільки з них пенальті
  assists: number;
  votes: number;
  rating: number | null; // середня оцінка фанатів за цей матч
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

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

type Agg = { weighted: number; minutes: number };
const emptyAgg = (): Agg => ({ weighted: 0, minutes: 0 });
const avg = (a: Agg) => (a.minutes > 0 ? Math.round((a.weighted / a.minutes) * 10) / 10 : null);

export default function SeasonTable({
  rows,
  competitions,
}: {
  rows: MatchRow[];
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
  const [months, setMonths] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Set<PositionGroup>>(new Set());
  // true — одна сумарна оцінка (як раніше); false — окремо старт і заміни
  const [combine, setCombine] = useState(true);

  function toggle<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) {
    setter((cur) => {
      const next = new Set(cur);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  // Місяці, у яких є матчі в обраних турнірах
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (checked.has(r.competitionSlug)) set.add(r.month);
    return Array.from(set).sort();
  }, [rows, checked]);
  const multiYear = new Set(availableMonths.map((m) => m.slice(0, 4))).size > 1;
  const activeMonths = useMemo(
    () => new Set(Array.from(months).filter((m) => availableMonths.includes(m))),
    [months, availableMonths]
  );

  const displayRows = useMemo(() => {
    const acc = new Map<
      string,
      {
        name: string;
        position: string | null;
        matches: number;
        starts: number;
        goals: number;
        penaltyGoals: number;
        assists: number;
        votes: number;
        minutes: number;
        all: Agg;
        start: Agg;
        sub: Agg;
      }
    >();
    for (const r of rows) {
      if (!checked.has(r.competitionSlug)) continue;
      if (activeMonths.size > 0 && !activeMonths.has(r.month)) continue;
      if (groups.size > 0) {
        const g = positionGroup(r.position);
        if (!g || !groups.has(g)) continue;
      }
      const cur =
        acc.get(r.id) ??
        {
          name: r.fullName,
          position: r.position,
          matches: 0,
          starts: 0,
          goals: 0,
          penaltyGoals: 0,
          assists: 0,
          votes: 0,
          minutes: 0,
          all: emptyAgg(),
          start: emptyAgg(),
          sub: emptyAgg(),
        };
      if (r.rating != null) cur.matches += 1;
      if (r.isStarting && r.rating != null) cur.starts += 1;
      cur.goals += r.goals;
      cur.penaltyGoals += r.penaltyGoals;
      cur.assists += r.assists;
      cur.votes += r.votes;
      cur.minutes += r.minutes;
      if (r.rating != null && r.minutes > 0) {
        const w = r.rating * r.minutes;
        cur.all.weighted += w;
        cur.all.minutes += r.minutes;
        const bucket = r.isStarting ? cur.start : cur.sub;
        bucket.weighted += w;
        bucket.minutes += r.minutes;
      }
      acc.set(r.id, cur);
    }
    return Array.from(acc.entries()).map(([id, v]) => {
      const ratingAll = avg(v.all);
      const ratingStart = avg(v.start);
      const ratingSub = avg(v.sub);
      return {
        id,
        full_name: v.name,
        matches: v.matches,
        starts: v.starts,
        goals: v.goals,
        penaltyGoals: v.penaltyGoals,
        assists: v.assists,
        votes: v.votes,
        minutes: v.minutes,
        ratingStart,
        ratingSub,
        // Що саме показує велика зірка: сума, або (в окремому режимі) старт
        season_rating: combine ? ratingAll : ratingStart,
      };
    });
  }, [rows, checked, activeMonths, groups, combine]);

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
    const val = (r: (typeof copy)[number]) =>
      sortKey === "season_rating" ? r.season_rating ?? (combine ? -1 : r.ratingSub ?? -1) : Number(r[sortKey] ?? 0);
    copy.sort((a, b) => (sortDir === "desc" ? val(b) - val(a) : val(a) - val(b)));
    return copy;
  }, [displayRows, sortKey, sortDir, combine]);

  // Змінюється при кожній зміні фільтрів → <tbody> перемонтовується, і рядки
  // плавно «вїжджають» знову (анімований перехід між виглядами таблиці).
  const filterSig = [
    Array.from(checked).sort().join(","),
    Array.from(activeMonths).sort().join(","),
    Array.from(groups).sort().join(","),
    combine ? "c" : "s",
  ].join("|");

  const pill = (on: boolean) =>
    `px-4 py-2 rounded-full text-sm border transition-colors duration-150 ${
      on ? "bg-panel-raised border-gold/40 text-gold-bright" : "border-white/10 text-muted hover:border-white/25"
    }`;
  const chip = (on: boolean) =>
    `px-3 py-1 rounded-full text-xs border transition-colors duration-150 ${
      on ? "bg-panel-raised border-gold/40 text-gold-bright" : "border-white/10 text-muted hover:border-white/25"
    }`;

  const officialComps = competitions.filter((c) => c.slug !== "friendly");
  const friendlyComps = competitions.filter((c) => c.slug === "friendly");

  return (
    <div>
      <div className="rounded-xl border border-white/5 bg-panel/50 p-4 mb-6 flex flex-col gap-4">
        {/* Турніри */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setChecked(new Set(allSlugs))}
            className={pill(allChecked)}
            title="Обрати всі турніри, включно з товариськими"
          >
            Всі
          </button>
          {[...officialComps, ...friendlyComps].map((c) => (
            <button key={c.id} onClick={() => toggle(setChecked, c.slug)} className={pill(checked.has(c.slug))}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {/* Позиція — овал із 4 секцій */}
          <div className="flex items-center gap-3">
            <span className="eyebrow">Позиція</span>
            <div
              role="group"
              aria-label="Фільтр за позицією"
              className="inline-flex rounded-full overflow-hidden border border-white/10 bg-panel-raised/60"
            >
              {POSITION_GROUPS.map((g, i) => {
                const on = groups.has(g.key);
                return (
                  <button
                    key={g.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(setGroups, g.key)}
                    title={on ? "Натисни ще раз, щоб вимкнути фільтр" : `Показати лише ${g.label}`}
                    className={`px-4 py-1.5 text-xs font-bold font-utility tracking-wide transition-all duration-300 ${
                      i > 0 ? "border-l border-white/10" : ""
                    }`}
                    style={
                      on
                        ? { background: g.color, color: g.text }
                        : { background: `${g.color}1F`, color: g.color }
                    }
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Старт + заміни: поєднати чи окремо */}
          <button
            type="button"
            role="switch"
            aria-checked={combine}
            onClick={() => setCombine((v) => !v)}
            className="flex items-center gap-3 text-left"
          >
            <span
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                combine ? "bg-gold" : "bg-panel-raised border border-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-ivory transition-all duration-200 ${
                  combine ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            <span className="text-xs text-ivory">Поєднати оцінки зі старту й із замін</span>
          </button>
        </div>

        {/* Місяці */}
        {availableMonths.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="eyebrow mr-1">Місяць</span>
            <button onClick={() => setMonths(new Set())} className={chip(activeMonths.size === 0)}>
              Усі
            </button>
            {availableMonths.map((m) => {
              const [y, mm] = m.split("-");
              return (
                <button key={m} onClick={() => toggle(setMonths, m)} className={chip(activeMonths.has(m))}>
                  {MONTHS[Number(mm) - 1]}
                  {multiYear ? ` ${y}` : ""}
                </button>
              );
            })}
          </div>
        )}

        {!combine && (
          <p className="text-[11px] text-muted -mt-1">
            Велика зірка — оцінка зі стартового складу, мала в кутку — оцінка, коли гравець виходив із лавки.
            Голи, асисти й хвилини рахуються разом.
          </p>
        )}
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
          <tbody key={filterSig} className="divide-y divide-white/5">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-6 text-center text-muted">
                  {checked.size === 0 ? "Обери хоча б один турнір." : "Немає даних для обраних фільтрів."}
                </td>
              </tr>
            )}
            {sorted.map((p, i) => {
              const rc = p.season_rating != null ? ratingColor(p.season_rating) : null;
              const rs = !combine && p.ratingSub != null ? ratingColor(p.ratingSub) : null;
              return (
                <tr
                  key={p.id}
                  className="bg-panel/80 hover:bg-transparent transition-colors duration-150 animate-row-in"
                  style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}
                >
                  <td className="px-5 py-4 font-display text-gold/50">{i + 1}</td>
                  <td className="px-5 py-4 text-ivory">
                    <Link href={`/players/${p.id}`} className="hover:text-gold-bright">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.matches}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.minutes}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">
                    {/* Голи ВСЬОГО (разом з пенальті). Пенальті — маленька жовта
                        цифра внизу праворуч, як нижній індекс; position:absolute,
                        щоб не змінювати висоту рядка. */}
                    <span className="relative inline-block">
                      {p.goals}
                      {p.penaltyGoals > 0 && (
                        <span
                          className="absolute left-full bottom-[-5px] ml-0.5 text-[9px] leading-none text-gold-bright font-bold"
                          title={`З них з пенальті: ${p.penaltyGoals}`}
                        >
                          {p.penaltyGoals}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.assists}</td>
                  <td className="px-5 py-4 text-right font-utility text-muted">{p.votes}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="relative inline-flex">
                      {rc ? (
                        <span
                          className="rating-star inline-flex h-9 w-9 items-center justify-center font-utility text-xs font-bold"
                          style={{ background: rc.bg, color: rc.text }}
                        >
                          {p.season_rating?.toFixed(1)}
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center font-utility text-xs text-muted/50"
                          title="Не виходив у стартовому складі"
                        >
                          —
                        </span>
                      )}
                      {rs && p.ratingSub != null && (
                        <span
                          className="rating-star absolute -bottom-2 -right-3 h-5 w-5 flex items-center justify-center font-utility text-[8px] font-bold"
                          style={{ background: rs.bg, color: rs.text }}
                          title="Оцінка із замін"
                        >
                          {p.ratingSub.toFixed(1)}
                        </span>
                      )}
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
