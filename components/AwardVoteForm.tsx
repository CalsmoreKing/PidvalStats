"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLACE_POINTS } from "@/lib/award";

type N = { id: string; name: string };

// Обираєш 5 учасників по порядку: перший клік — 1 місце (5 балів) …
// п'ятий — 5 місце (1 бал). Повторний клік по обраному — прибирає його.
export default function AwardVoteForm({
  nominees,
  selfIds,
  initialPicks,
}: {
  nominees: N[];
  selfIds: string[];
  initialPicks: string[];
}) {
  const router = useRouter();
  const [picks, setPicks] = useState<string[]>(initialPicks);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(initialPicks.length === 5 ? "done" : "idle");
  const [err, setErr] = useState("");
  const byId = new Map(nominees.map((n) => [n.id, n]));
  const locked = status === "done";

  function toggle(id: string) {
    if (locked || selfIds.includes(id)) return;
    setPicks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 5 ? [...cur, id] : cur));
  }

  async function submit() {
    setStatus("saving");
    setErr("");
    const res = await fetch("/api/award/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Не вдалось надіслати");
      setStatus("error");
      return;
    }
    setStatus("done");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {locked && (
        <div className="gold-frame rounded-2xl px-4 py-4 text-center">
          <div className="font-display text-xl text-gold-bright">Твій голос враховано</div>
          <div className="text-xs text-muted mt-0.5">Поки голосування відкрите, його можна змінити.</div>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 rounded-lg border border-gold/40 text-gold-bright px-4 py-1.5 text-xs"
          >
            Змінити голос
          </button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {PLACE_POINTS.map((pts, i) => {
          const n = picks[i] ? byId.get(picks[i]) : null;
          return (
            <button
              key={i}
              type="button"
              disabled={!n || locked}
              onClick={() => n && toggle(n.id)}
              className={`rounded-xl border px-2 py-3 text-center min-h-[84px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                n ? "gold-frame" : "border-dashed border-gold/20 bg-panel/40"
              }`}
            >
              <span className="gold-text font-display font-black text-3xl leading-none">{i + 1}</span>
              <span className="text-[10px] text-muted">{pts} б.</span>
              <span className="text-[10px] sm:text-[11px] text-ivory leading-tight break-words max-w-full">{n?.name ?? "—"}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {nominees.map((n) => {
          const place = picks.indexOf(n.id);
          const self = selfIds.includes(n.id);
          return (
            <button
              key={n.id}
              type="button"
              disabled={self || locked}
              onClick={() => toggle(n.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                place >= 0
                  ? "border-gold bg-panel-raised text-ivory"
                  : self
                  ? "border-white/5 bg-panel/30 text-muted/50 cursor-not-allowed"
                  : "border-white/10 bg-panel text-ivory/90 hover:border-white/30"
              }`}
            >
              <span
                className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  place >= 0 ? "bg-gradient-to-br from-[#fff1b0] to-[#b88a1c] text-void" : "bg-panel-raised text-muted"
                }`}
              >
                {place >= 0 ? place + 1 : ""}
              </span>
              <span className="truncate">{n.name}</span>
              {self && <span className="ml-auto text-[10px] text-muted">це ти</span>}
            </button>
          );
        })}
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {!locked && (
        <button
          disabled={picks.length !== 5 || status === "saving"}
          onClick={submit}
          className="rounded-xl bg-gradient-to-r from-[#b88a1c] via-[#f3cc5c] to-[#b88a1c] text-void font-display font-bold text-lg py-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]"
        >
          {status === "saving" ? "Надсилаємо…" : picks.length === 5 ? "Надіслати голос" : `Обери ще ${5 - picks.length}`}
        </button>
      )}
    </div>
  );
}
