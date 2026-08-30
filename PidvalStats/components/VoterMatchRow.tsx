"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingColor } from "@/lib/display";
import LocalDateTime from "@/components/LocalDateTime";
import { TokenVisual } from "@/components/FormationPitch";

type Rating = {
  playerId: string;
  playerName: string;
  shortName: string | null;
  jersey: number | null;
  photoUrl: string | null;
  photoFocusX: number | null;
  photoFocusY: number | null;
  photoZoom: number | null;
  nationality: string | null;
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
        <div className="bg-panel px-5 py-5 flex flex-col gap-5">
          {starters.length > 0 && (
            <div>
              <div className="eyebrow mb-3">Старт</div>
              <div className="flex flex-wrap gap-x-5 gap-y-6">
                {starters.map((r) => (
                  <TokenLink key={r.playerId} r={r} />
                ))}
              </div>
            </div>
          )}
          {bench.length > 0 && (
            <div>
              <div className="eyebrow mb-3">Лавка</div>
              <div className="flex flex-wrap gap-x-5 gap-y-6">
                {bench.map((r) => (
                  <TokenLink key={r.playerId} r={r} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TokenLink({ r, compact }: { r: Rating; compact?: boolean }) {
  const rc = ratingColor(r.rating);
  return (
    <Link href={`/players/${r.playerId}`} className="relative">
      <TokenVisual
        slot={{
          id: r.playerId,
          name: r.playerName,
          shortName: r.shortName,
          jersey: r.jersey,
          rating: r.rating,
          photoUrl: r.photoUrl,
          photoFocusX: r.photoFocusX,
          photoFocusY: r.photoFocusY,
          photoZoom: r.photoZoom,
          nationality: r.nationality,
        }}
        compact={compact}
      />
      {r.isMvpPick && (
        <span
          className="absolute -top-1 left-1/2 -translate-x-1/2 rating-star px-1.5 py-0.5 text-[8px] font-bold"
          style={{ background: rc.bg, color: rc.text }}
        >
          MVP
        </span>
      )}
    </Link>
  );
}
