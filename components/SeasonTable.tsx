"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";
import { POSITION_GROUPS, PositionGroup, positionGroup } from "@/lib/positions";
import { MIN_MINUTES_FOR_RATING, MIN_MATCHES_FOR_RANK, qualifiesForRank } from "@/lib/season";

// Один рядок = гравець в одному матчі (view season_player_matches). Усі
// фільтри (турнір, місяць, позиція, старт/заміна) рахуються тут, з сирих
// цифр, тож будь-яка комбінація дає точні підсумки — без окремої view під
// кожен фільтр.
export type MatchRow = {
  id: string; // player id
  matchId: string;
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
  result: "win" | "draw" | "loss" | null; // результат матчу для команди
};

type SortKey =
  | "matches"
  | "goals"
  | "assists"
  | "votes"
  | "minutes"
  | "minutes_pct"
  | "minutes_avg"
  | "winrate"
  | "season_rating";

const columns: { key: SortKey; label: string; accent?: boolean }[] = [
  { key: "matches", label: "Матчі", accent: true },
  { key: "minutes", label: "Хвилини" },
  { key: "minutes_pct", label: "% часу" },
  { key: "minutes_avg", label: "Хв/матч" },
  { key: "goals", label: "Голи", accent: true },
  { key: "assists", label: "Асисти", accent: true },
  { key: "votes", label: "Голоси" },
  { key: "winrate", label: "Вінрейт" },
  { key: "season_rating", label: "Рейтинг" },
];

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

type Agg = { weighted: number; minutes: number; apps: number };
const emptyAgg = (): Agg => ({ weighted: 0, minutes: 0, apps: 0 });
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
        subMinutes: number;
        matchIds: Set<string>;
        teamWinIds: Set<string>;
        teamAllIds: Set<string>;
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
          subMinutes: 0,
          matchIds: new Set<string>(),
          teamWinIds: new Set<string>(),
          teamAllIds: new Set<string>(),
          all: emptyAgg(),
          start: emptyAgg(),
          sub: emptyAgg(),
        };
      // Один матч іде в залік оцінки лише з 25+ хвилин (rating_min_minutes()).
      const counted = r.rating != null && r.minutes >= MIN_MINUTES_FOR_RATING;
      if (counted) cur.matches += 1;
      if (r.isStarting && counted) cur.starts += 1;
      cur.goals += r.goals;
      cur.penaltyGoals += r.penaltyGoals;
      cur.assists += r.assists;
      cur.votes += r.votes;
      cur.minutes += r.minutes;
      cur.matchIds.add(r.matchId);
      cur.teamAllIds.add(r.matchId);
      if (r.result === "win") cur.teamWinIds.add(r.matchId);
      if (!r.isStarting) cur.subMinutes += r.minutes;
      cur.all.apps += 1;
      if (r.isStarting) cur.start.apps += 1;
      else cur.sub.apps += 1;
      if (counted && r.minutes > 0) {
        const w = (r.rating ?? 0) * r.minutes;
        cur.all.weighted += w;
        cur.all.minutes += r.minutes;
        const bucket = r.isStarting ? cur.start : cur.sub;
        bucket.weighted += w;
        bucket.minutes += r.minutes;
      }
      acc.set(r.id, cur);
    }
    return Array.from(acc.entries()).map(([id, v]) => ({
      id,
      full_name: v.name,
      matches: v.matches,
      starts: v.starts,
      goals: v.goals,
      penaltyGoals: v.penaltyGoals,
      assists: v.assists,
      votes: v.votes,
      minutes: v.minutes,
      subMinutes: v.subMinutes,
      // «% часу» = скільки з ВЛАСНИХ можливих хвилин гравець провів на полі:
      // його матчі × 90 (або 120, якщо був овертайм). 10 матчів = 900 хв.
      minutes_pct:
        v.teamAllIds.size > 0
          ? Math.round((v.minutes / (v.teamAllIds.size * 90)) * 1000) / 10
          : 0,
      minutes_avg: v.all.apps > 0 ? Math.round(v.minutes / v.all.apps) : 0,
      ratingStart: avg(v.start),
      ratingSub: avg(v.sub),
      ratingAll: avg(v.all),
      qualified: qualifiesForRank(v.matches, v.minutes),
      // Вінрейт: у скількох зі своїх матчів він грав — і скільки з них команда виграла.
      winrate: v.teamAllIds.size > 0 ? Math.round((v.teamWinIds.size / v.teamAllIds.size) * 100) : 0,
      winrateGames: v.teamAllIds.size,
      winrateStarts: v.teamAllIds.size,
      season_rating: combine ? avg(v.all) : avg(v.start),
    }));
  }, [rows, checked, activeMonths, groups, combine]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // Сортування + правило рейтингу: коли сортуємо саме за оцінкою, гравці без
  // достатньої кількості залікових матчів завжди йдуть під рештою — навіть
  // з високим середнім (один вдалий вихід не робить гравця топом сезону).
  const sorted = useMemo(() => {
    const copy = [...displayRows];
    const val = (r: (typeof copy)[number]) =>
      sortKey === "season_rating" ? r.season_rating ?? (combine ? -1 : r.ratingSub ?? -1) : Number(r[sortKey] ?? 0);
    copy.sort((a, b) => {
      if (sortKey === "season_rating" && a.qualified !== b.qualified) {
        return a.qualified ? -1 : 1;
      }
      return sortDir === "desc" ? val(b) - val(a) : val(a) - val(b);
    });
    return copy;
  }, [displayRows, sortKey, sortDir, combine]);

  // Місце в рейтингу рахуємо лише серед тих, хто пройшов поріг.
  const rankOf = useMemo(() => {
    const map = new Map<string, number>();
    if (sortKey !== "season_rating" || sortDir !== "desc") return map;
    let place = 0;
    for (const r of sorted) {
      if (!r.qualified) break;
      map.set(r.id, ++place);
    }
    return map;
  }, [sorted, sortKey, sortDir]);

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

     </div>

      <div className="rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-xs sm:text-sm sm:min-w-[760px]">
          <thead>
            <tr className="bg-panel-raised text-muted eyebrow text-left">
              <th className="px-2 sm:px-5 py-3 font-normal">#</th>
              <th className="px-2 sm:px-5 py-3 font-normal sticky left-0 bg-panel-raised">Гравець</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-2 sm:px-5 py-3 font-normal text-right cursor-pointer select-none hover:text-gold-bright transition-colors duration-150 ${
                    col.accent ? "text-gold-bright" : ""
                  }`}
                >
                  <span>{col.label}</span>
                  {sortKey === col.key && (sortDir === "desc" ? " ↓" : " ↑")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={filterSig} className="divide-y divide-white/5">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-6 text-center text-muted">
                  {checked.size === 0 ? "Обери хоча б один турнір." : "Немає даних для обраних фільтрів."}
                </td>
              </tr>
            )}
            {sorted.map((p, i) => {
              const rc = p.season_rating != null ? ratingColor(p.season_rating) : null;
              const rs = !combine && p.ratingSub != null ? ratingColor(p.ratingSub) : null;
              const place = rankOf.get(p.id) ?? i + 1;
              const muted = sortKey === "season_rating" && sortDir === "desc" && !p.qualified;
              return (
                <tr
                  key={p.id}
                  className={`bg-panel/80 hover:bg-transparent transition-colors duration-150 animate-row-in ${
                    muted ? "opacity-60" : ""
                  }`}
                  style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}
                >
                  <td className="px-2 sm:px-5 py-3 sm:py-4 font-display text-gold/50">
                    {sortKey === "season_rating" && sortDir === "desc" && !p.qualified ? "—" : place}
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-ivory">
                    <Link href={`/players/${p.id}`} className="hover:text-gold-bright">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-gold/80">{p.matches}</td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-muted">
                    {/* Хвилини ВСЬОГО; хвилини із замін — маленька жовта цифра
                        справа, як у Голах. Без title: не має бути ховера. */}
                    <span className="relative inline-block">
                      {p.minutes}
                      {p.subMinutes > 0 && (
                        <span className="absolute left-full bottom-[-5px] ml-0.5 text-[9px] leading-none font-bold text-[#FFD24A]">
                          {p.subMinutes}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-muted">{p.minutes_pct}%</td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-muted">{p.minutes_avg}</td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-champagne/90">
                    {/* Голи ВСЬОГО (разом з пенальті). Пенальті — маленька жовта
                        цифра внизу праворуч, як нижній індекс; position:absolute,
                        щоб не змінювати висоту рядка. */}
                    <span className="relative inline-block">
                      {p.goals}
                      {p.penaltyGoals > 0 && (
                        <span className="absolute left-full bottom-[-5px] ml-0.5 text-[9px] leading-none font-bold text-[#FFD24A]">
                          {p.penaltyGoals}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-champagne/90">{p.assists}</td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility text-muted">{p.votes}</td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right font-utility">
                    <span
                      className="tabular-nums"
                      style={{ color: p.winrate >= 60 ? "#5FD08A" : p.winrate <= 35 ? "#E07272" : undefined }}
                    >
                      {p.winrate}%
                    </span>
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-4 text-right">
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
