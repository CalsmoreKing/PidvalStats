"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";
import LocalDateTime from "@/components/LocalDateTime";
import VoterMatchRow from "@/components/VoterMatchRow";

type HistoryRow = {
  match_id: string;
  opponent_name: string;
  match_date: string;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
  competition_slug: string;
  player_id: string;
  player_name: string;
  player_short_name: string | null;
  jersey_number: number | null;
  photo_url: string | null;
  photo_focus_x: number | null;
  photo_focus_y: number | null;
  photo_zoom: number | null;
  nationality: string | null;
  rating: number;
  is_starting: boolean | null;
  is_mvp_pick: boolean;
};

export default function VoterProfileClient({
  voter,
  history,
  canSeeRatings,
  isOwner,
}: {
  voter: { id: string; displayName: string | null; avatarUrl: string | null };
  history: HistoryRow[];
  canSeeRatings: boolean;
  isOwner: boolean;
}) {
  // За замовчуванням товариські сховані — інакше давно завершені товариські
  // спотворюють "кому ставить найнижче" гравцями дублю, яких викликали на
  // одну гру.
  const [showFriendly, setShowFriendly] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const hasFriendly = history.some((r) => r.competition_slug === "friendly");
  const filtered = useMemo(
    () => (showFriendly ? history : history.filter((r) => r.competition_slug !== "friendly")),
    [history, showFriendly]
  );

  const histogram = useMemo(() => {
    const counts = new Array(10).fill(0);
    for (const r of filtered) counts[Math.round(r.rating) - 1]++;
    return counts.map((count, i) => ({ score: i + 1, count }));
  }, [filtered]);
  const maxHist = Math.max(1, ...histogram.map((h) => h.count));

  const { top, bottom } = useMemo(() => {
    const byPlayer = new Map<string, { id: string; name: string; ratings: number[] }>();
    for (const r of filtered) {
      const cur = byPlayer.get(r.player_id) ?? { id: r.player_id, name: r.player_name, ratings: [] };
      cur.ratings.push(r.rating);
      byPlayer.set(r.player_id, cur);
    }
    const averaged = Array.from(byPlayer.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avg: p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length,
    }));
    return {
      top: [...averaged].sort((a, b) => b.avg - a.avg).slice(0, 3),
      bottom: [...averaged].sort((a, b) => a.avg - b.avg).slice(0, 3),
    };
  }, [filtered]);

  const selectedDetail = useMemo(() => {
    if (selectedRating == null) return [];
    return filtered.filter((r) => Math.round(r.rating) === selectedRating);
  }, [filtered, selectedRating]);

  const byMatch = useMemo(() => {
    const map = new Map<
      string,
      {
        matchId: string;
        opponentName: string;
        matchDate: string;
        isHome: boolean;
        homeScore: number | null;
        awayScore: number | null;
        ratings: any[];
      }
    >();
    for (const row of filtered) {
      const cur = map.get(row.match_id) ?? {
        matchId: row.match_id,
        opponentName: row.opponent_name,
        matchDate: row.match_date,
        isHome: row.is_home,
        homeScore: row.home_score,
        awayScore: row.away_score,
        ratings: [],
      };
      cur.ratings.push({
        playerId: row.player_id,
        playerName: row.player_name,
        shortName: row.player_short_name,
        jersey: row.jersey_number,
        photoUrl: row.photo_url,
        photoFocusX: row.photo_focus_x,
        photoFocusY: row.photo_focus_y,
        photoZoom: row.photo_zoom,
        nationality: row.nationality,
        rating: row.rating,
        isMvpPick: row.is_mvp_pick,
        isStarting: row.is_starting,
      });
      map.set(row.match_id, cur);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      {/* Банер профілю */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-panel mb-10">
        <div className="h-16 bg-gradient-to-r from-gold/25 via-panel-raised to-panel-raised" aria-hidden />
        <div className="px-6 pb-5 -mt-9 flex items-end gap-4 flex-wrap">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-panel bg-panel-raised shrink-0">
            {voter.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={voter.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl text-ivory/40 font-display">
                {(voter.displayName ?? "?")[0]}
              </div>
            )}
          </div>
          <div className="pb-1">
            <div className="eyebrow mb-0.5">Профіль фаната</div>
            <h1 className="font-display text-2xl text-ivory">{voter.displayName}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3 mb-2">
            {hasFriendly && (
              <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFriendly}
                  onChange={(e) => setShowFriendly(e.target.checked)}
                  className="accent-gold"
                />
                Показати товариські
              </label>
            )}
            {isOwner && (
              <Link
                href="/settings"
                className="text-xs text-muted hover:text-gold-bright transition-colors duration-150"
              >
                Налаштувати профіль →
              </Link>
            )}
          </div>
        </div>
      </div>

      {!canSeeRatings ? (
        <p className="text-sm text-muted">Цей фанат вирішив не показувати свої оцінки іншим.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">
          {history.length > 0
            ? "Немає голосів по офіційних матчах — спробуй увімкнути товариські."
            : "Ще немає голосів по завершених матчах — з'являться тут одразу після підрахунку."}
        </p>
      ) : (
        <>
          <section className="mb-10">
            <div className="eyebrow mb-3">Розподіл оцінок</div>
            <div className="flex items-end gap-1.5 bg-panel rounded-xl px-4 pt-3 pb-2">
              {histogram.map((h) => (
                <button
                  key={h.score}
                  onClick={() => setSelectedRating((cur) => (cur === h.score ? null : h.score))}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <span className="text-[9px] text-muted font-utility h-3">{h.count || ""}</span>
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      selectedRating === h.score ? "" : "group-hover:opacity-80"
                    }`}
                    style={{
                      height: `${Math.max(3, Math.round((h.count / maxHist) * 64))}px`,
                      background: ratingColor(h.score).bg,
                      opacity: h.count === 0 ? 0.12 : selectedRating === h.score ? 1 : 0.85,
                      outline: selectedRating === h.score ? "2px solid #D4AF37" : undefined,
                    }}
                  />
                  <span className="text-[9px] text-muted font-utility">{h.score}</span>
                </button>
              ))}
            </div>

            {selectedRating != null && (
              <div className="mt-3 rounded-xl border border-gold/20 bg-panel/60 p-3 flex flex-col gap-2">
                <div className="text-[11px] text-muted">
                  Оцінка {selectedRating} — {selectedDetail.length}{" "}
                  {selectedDetail.length === 1 ? "раз" : "разів"}:
                </div>
                {selectedDetail.map((r, i) => (
                  <Link
                    key={i}
                    href={`/matches/${r.match_id}`}
                    className="flex items-center justify-between text-xs text-ivory hover:text-gold-bright transition-colors duration-150"
                  >
                    <span>
                      {r.player_name} · {r.is_home ? "Барселона" : r.opponent_name} —{" "}
                      {r.is_home ? r.opponent_name : "Барселона"}
                    </span>
                    <LocalDateTime iso={r.match_date} mode="date" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {(top.length > 0 || bottom.length > 0) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {top.length > 0 && <FavList title="Кому ставить найвище" items={top} />}
              {bottom.length > 0 && <FavList title="Кому ставить найнижче" items={bottom} />}
            </section>
          )}

          <section>
            <div className="eyebrow mb-3">Оцінки за матчі</div>
            <div className="flex flex-col gap-3">
              {byMatch.map((m) => (
                <VoterMatchRow key={m.matchId} {...m} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function FavList({ title, items }: { title: string; items: { id: string; name: string; avg: number }[] }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((p) => {
          const rc = ratingColor(p.avg);
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 hover:bg-panel-raised transition-colors duration-150"
            >
              <span className="text-sm text-ivory truncate">{p.name}</span>
              <span
                className="rating-star h-7 w-7 shrink-0 flex items-center justify-center font-utility text-[10px] font-bold"
                style={{ background: rc.bg, color: rc.text }}
              >
                {p.avg.toFixed(1)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
