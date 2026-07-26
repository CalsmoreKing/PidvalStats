"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateMatchForm({
  competitions,
}: {
  competitions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [isHome, setIsHome] = useState(true);
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [referee, setReferee] = useState("");
  const [coachName, setCoachName] = useState("");
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
        competitionId,
        isHome,
        matchDate,
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
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <input
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          placeholder="Тренер"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
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
