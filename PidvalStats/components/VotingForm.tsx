"use client";

import { useState } from "react";
import { flagUrl } from "@/lib/flags";
import { shortName } from "@/lib/display";

export type VotablePlayer = {
  playerId: string;
  name: string;
  jersey: number;
  isSub?: boolean;
  photoUrl?: string | null;
  nationality?: string | null;
};

function PlayerVotePoster({
  p,
  rating,
  onRate,
  isMvp,
  onToggleMvp,
  readOnly,
}: {
  p: VotablePlayer;
  rating: number | undefined;
  onRate: (n: number) => void;
  isMvp: boolean;
  onToggleMvp: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="relative aspect-[2/1] rounded-2xl overflow-hidden border border-white/5 bg-panel">
      {p.nationality && (
        <div
          className="absolute -inset-6"
          style={{
            backgroundImage: `url(${flagUrl(p.nationality, "svg")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "rotate(-4deg) scale(1.3)",
          }}
          aria-hidden
        />
      )}

      <div className="relative h-full flex items-stretch">
        {/* Фото зліва — як на банері профілю */}
        <div className="w-[36%] shrink-0 h-full flex items-end justify-center">
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photoUrl}
              alt={p.name}
              className="max-h-full w-auto object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-panel/40">
              <span className="font-display text-3xl text-ivory/20">{shortName(p.name)[0]}</span>
            </div>
          )}
        </div>

        {/* Затемнений градієнт — тільки під кнопками, не заходить на фото */}
        <div className="flex-1 relative flex flex-col justify-center px-3 py-2 gap-1.5">
          <div className="absolute inset-0 bg-gradient-to-r from-panel/40 via-panel/85 to-panel/95" aria-hidden />

          <div className="relative flex items-center justify-between mb-1">
            <div className="text-xs text-ivory truncate">
              <span className="font-utility text-gold-bright/80 mr-1">{p.jersey}</span>
              {shortName(p.name)}
              {p.isSub && <span className="eyebrow ml-1">заміна</span>}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onToggleMvp}
                aria-pressed={isMvp}
                className={`rating-star h-7 w-7 shrink-0 flex items-center justify-center text-[9px] font-bold transition-opacity duration-150 ${
                  isMvp ? "opacity-100" : "opacity-25 hover:opacity-60"
                }`}
                title="Обрати MVP матчу"
              >
                MVP
              </button>
            )}
            {readOnly && isMvp && (
              <div className="rating-star h-7 w-7 shrink-0 flex items-center justify-center text-[9px] font-bold">
                MVP
              </div>
            )}
          </div>

          <div className="relative flex flex-col gap-1">
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <RateButton key={n} n={n} active={rating === n} onClick={() => onRate(n)} readOnly={readOnly} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[6, 7, 8, 9, 10].map((n) => (
                <RateButton key={n} n={n} active={rating === n} onClick={() => onRate(n)} readOnly={readOnly} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RateButton({
  n,
  active,
  onClick,
  readOnly,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
      className={`h-7 rounded font-utility text-xs transition-colors duration-150 ${
        active
          ? "bg-gold text-void font-bold"
          : readOnly
          ? "bg-panel-raised/50 text-muted/40"
          : "bg-panel-raised text-muted hover:text-ivory"
      }`}
    >
      {n}
    </button>
  );
}

export default function VotingForm({
  matchId,
  players,
  initialVotes,
}: {
  matchId: string;
  players: VotablePlayer[];
  initialVotes?: { ratings: Record<string, number>; mvpPlayerId: string | null } | null;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(initialVotes?.ratings ?? {});
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(initialVotes?.mvpPlayerId ?? null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    initialVotes ? "done" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const allRated = players.every((p) => ratings[p.playerId] != null);
  const readOnly = status === "done";

  async function submit() {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          ratings: players.map((p) => ({ playerId: p.playerId, rating: ratings[p.playerId] })),
          mvpPlayerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Щось пішло не так");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Не вдалось надіслати голос. Перевір з'єднання.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "done" && (
        <div className="rounded-xl border border-gold/30 bg-panel px-4 py-3 text-center">
          <div className="font-display text-base text-gold-bright">
            {initialVotes ? "Твій голос за цей матч" : "Дякуємо за голос!"}
          </div>
          <div className="text-xs text-muted mt-0.5">Результат буде видно, коли голосування завершиться.</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {players.map((p) => (
          <PlayerVotePoster
            key={p.playerId}
            p={p}
            rating={ratings[p.playerId]}
            onRate={(n) => !readOnly && setRatings((r) => ({ ...r, [p.playerId]: n }))}
            isMvp={mvpPlayerId === p.playerId}
            onToggleMvp={() => setMvpPlayerId((cur) => (cur === p.playerId ? null : p.playerId))}
            readOnly={readOnly}
          />
        ))}
      </div>

      {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}

      {!readOnly && (
        <button
          type="button"
          disabled={!allRated || status === "submitting"}
          onClick={submit}
          className="mt-1 rounded-xl bg-gold text-void font-display text-lg py-3 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
        >
          {status === "submitting" ? "Надсилаємо…" : "Надіслати голос"}
        </button>
      )}
    </div>
  );
}
