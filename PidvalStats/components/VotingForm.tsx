"use client";

import { useState } from "react";

export type VotablePlayer = {
  playerId: string;
  name: string;
  jersey: number;
  isSub?: boolean;
};

export default function VotingForm({
  matchId,
  players,
}: {
  matchId: string;
  players: VotablePlayer[];
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const allRated = players.every((p) => ratings[p.playerId] != null);

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

  if (status === "done") {
    return (
      <div className="rounded-xl border border-gold/30 bg-panel px-5 py-6 text-center">
        <div className="font-display text-lg text-gold-bright mb-1">Дякуємо за голос!</div>
        <div className="text-sm text-muted">
          Результат буде видно, коли голосування завершиться.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {players.map((p) => (
        <div key={p.playerId} className="rounded-xl border border-white/5 bg-panel px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-utility text-xs text-gold-bright/70 w-5">{p.jersey}</span>
              <span className="text-sm text-ivory">{p.name}</span>
              {p.isSub && <span className="eyebrow">заміна</span>}
            </div>
            <button
              type="button"
              onClick={() =>
                setMvpPlayerId((cur) => (cur === p.playerId ? null : p.playerId))
              }
              aria-pressed={mvpPlayerId === p.playerId}
              className={`rating-star h-8 w-8 flex items-center justify-center text-[10px] font-bold transition-opacity ${
                mvpPlayerId === p.playerId ? "opacity-100" : "opacity-25 hover:opacity-60"
              }`}
              title="Обрати MVP матчу"
            >
              MVP
            </button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const active = ratings[p.playerId] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRatings((r) => ({ ...r, [p.playerId]: n }))}
                  className={`h-8 rounded-md font-utility text-xs transition-colors ${
                    active
                      ? "bg-gold text-void font-bold"
                      : "bg-panel-raised text-muted hover:text-ivory"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}

      <button
        type="button"
        disabled={!allRated || status === "submitting"}
        onClick={submit}
        className="mt-2 rounded-xl bg-gold text-void font-display text-lg py-3 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Надсилаємо…" : "Надіслати голос"}
      </button>
    </div>
  );
}
