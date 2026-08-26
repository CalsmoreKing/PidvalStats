"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LastMatch = { competition_id: string; is_home: boolean; coach_name: string | null } | null;

export default function CreateMatchForm({
  competitions,
  lastMatch,
  refereeNames,
  coachNames,
}: {
  competitions: { id: string; name: string }[];
  lastMatch: LastMatch;
  refereeNames: string[];
  coachNames: string[];
}) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [crestUrl, setCrestUrl] = useState("");
  const [competitionId, setCompetitionId] = useState(lastMatch?.competition_id ?? competitions[0]?.id ?? "");
  const [isHome, setIsHome] = useState(lastMatch?.is_home ?? true);
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [referee, setReferee] = useState("");
  const [coachName, setCoachName] = useState(lastMatch?.coach_name ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!opponent || !competitionId || !matchDate) return;
    setStatus("saving");
    setErrorMsg("");
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opponentName: opponent,
        opponentCrestUrl: crestUrl || null,
        competitionId,
        isHome,
        // Конвертуємо в UTC ТУТ, у браузері адміна (де "21:30" правильно
        // означає 21:30 за його власним поясом) — а не на сервері, який
        // на Vercel завжди в UTC і прочитав би "21:30" як 21:30 UTC.
        matchDate: new Date(matchDate).toISOString(),
        venue,
        referee,
        coachName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Не вдалось створити матч");
      setStatus("error");
      return;
    }
    setOpponent("");
    setCrestUrl("");
    setVenue("");
    setReferee("");
    setMatchDate("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Суперник (напр. Реал Мадрид)"
          required
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <input
          value={crestUrl}
          onChange={(e) => setCrestUrl(e.target.value)}
          placeholder="URL герба суперника (необов'язково)"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        >
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          required
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-ivory">
          <input type="checkbox" checked={isHome} onChange={(e) => setIsHome(e.target.checked)} />
          Домашній матч
        </label>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Стадіон"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <input
          value={referee}
          onChange={(e) => setReferee(e.target.value)}
          placeholder="Рефері"
          list="referee-names"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <datalist id="referee-names">
          {refereeNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <input
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          placeholder="Тренер"
          list="coach-names"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <datalist id="coach-names">
          {coachNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="self-start rounded-lg bg-gold text-void font-display px-5 py-2 disabled:opacity-40"
      >
        {status === "saving" ? "Створюємо…" : "Створити матч"}
      </button>
    </form>
  );
}
