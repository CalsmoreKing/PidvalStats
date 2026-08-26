"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";
import LocalDateTime from "@/components/LocalDateTime";

type Rating = {
  playerId: string;
  playerName: string;
  rating: number;
  isMvpPick: boolean;
  isStarting: boolean | null;
};

export default function VoterMatchRow({
  matchId,
  opponentName,
  matchDate,
  isHome,
  homeScore,
  awayScore,
  ratings,
}: {
  matchId: string;
  opponentName: string;
  matchDate: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  ratings: Rating[];
}) {
  const [open, setOpen] = useState(false);
  const starters = ratings.filter((r) => r.isStarting === true);
  const bench = ratings.filter((r) => r.isStarting !== true);

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between bg-panel-raised px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <Link
              href={`/matches/${matchId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-ivory hover:text-gold-bright transition-colors duration-150"
            >
              {isHome ? "Барселона" : opponentName} — {isHome ? opponentName : "Барселона"}
            </Link>
            <div className="text-xs text-muted">
              <LocalDateTime iso={matchDate} mode="date" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {homeScore != null && awayScore != null && (
              <div className="font-utility text-ivory">
                {homeScore}:{awayScore}
              </div>
            )}
            <span className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="flex flex-col divide-y divide-white/5">
          {starters.length > 0 && (
            <div className="px-5 py-2 text-[10px] eyebrow bg-panel/40">Старт</div>
          )}
          {starters.map((r) => (
            <RatingRow key={r.playerId} r={r} />
          ))}
          {bench.length > 0 && <div className="px-5 py-2 text-[10px] eyebrow bg-panel/40">Лавка</div>}
          {bench.map((r) => (
            <RatingRow key={r.playerId} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RatingRow({ r }: { r: Rating }) {
  const rc = ratingColor(r.rating);
  return (
    <Link
      href={`/players/${r.playerId}`}
      className="flex items-center justify-between px-5 py-2.5 bg-panel/60 hover:bg-panel transition-colors duration-150"
    >
      <div className="flex items-center gap-2 text-sm text-ivory">
        {r.playerName}
        {r.isMvpPick && <span className="eyebrow text-gold-bright">MVP</span>}
      </div>
      <span
        className="rating-star h-8 w-8 flex items-center justify-center font-utility text-[11px] font-bold"
        style={{ background: rc.bg, color: rc.text }}
      >
        {r.rating}
      </span>
    </Link>
  );
}
