"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type RosterPlayer = {
  id: string;
  full_name: string;
  jersey_number: number | null;
  position: string;
};

type Selection = {
  included: boolean;
  isStarting: boolean;
  isCaptain: boolean;
  isInjured: boolean;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

const emptySel: Selection = {
  included: false,
  isStarting: false,
  isCaptain: false,
  isInjured: false,
  minutes: 90,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
};

export default function MatchAdminRow({
  match,
  roster,
}: {
  match: any;
  roster: RosterPlayer[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [savingLineup, setSavingLineup] = useState(false);
  const [openingVoting, setOpeningVoting] = useState(false);
  const [msg, setMsg] = useState("");

  function setSel(playerId: string, patch: Partial<Selection>) {
    setSelections((cur) => ({
      ...cur,
      [playerId]: { ...emptySel, ...cur[playerId], ...patch },
    }));
  }

  async function saveLineup() {
    setSavingLineup(true);
    setMsg("");
    const rows = Object.entries(selections)
      .filter(([, s]) => s.included)
      .map(([playerId, s]) => ({
        playerId,
        isStarting: s.isStarting,
        isCaptain: s.isCaptain,
        isInjured: s.isInjured,
        minutesPlayed: s.minutes,
        goals: s.goals,
        assists: s.assists,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
      }));

    const res = await fetch("/api/admin/lineup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, lineup: rows }),
    });
    const data = await res.json();
    setSavingLineup(false);
    if (!res.ok) {
      setMsg(data.error ?? "Помилка збереження складу");
      return;
    }
    setMsg("Склад збережено");
    router.refresh();
  }

  async function openVoting() {
    setOpeningVoting(true);
    setMsg("");
    const res = await fetch(`/api/admin/matches/${match.id}/open-voting`, { method: "POST" });
    const data = await res.json();
    setOpeningVoting(false);
    if (!res.ok) {
      setMsg(data.error ?? "Помилка відкриття голосування");
      return;
    }
    setMsg("Голосування відкрито на 15 хвилин");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/matches/${match.id}`} className="text-sm text-ivory hover:text-gold-bright">
          {match.is_home ? "Барселона" : match.opponent_name} —{" "}
          {match.is_home ? match.opponent_name : "Барселона"}
          <span className="text-muted ml-2 text-xs">{match.status}</span>
        </Link>
        <div className="flex items-center gap-2">
          {(match.status === "scheduled" || match.status === "live" || match.status === "finished") && (
            <button
              onClick={openVoting}
              disabled={openingVoting}
              className="text-xs rounded-lg bg-gold text-void px-3 py-1.5 font-medium disabled:opacity-40"
            >
              {openingVoting ? "…" : "Відкрити голосування"}
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs rounded-lg border border-white/10 text-muted px-3 py-1.5 hover:text-ivory"
          >
            {open ? "Сховати склад" : "Склад"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <div className="max-h-[28rem] overflow-y-auto flex flex-col gap-2 mb-3">
            {roster.map((p) => {
              const sel = selections[p.id] ?? emptySel;
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-2">
                  <span className="w-32 truncate text-ivory">{p.full_name}</span>
                  <span className="w-6 text-muted">{p.jersey_number ?? "—"}</span>
                  <label className="flex items-center gap-1 text-muted">
                    <input
                      type="checkbox"
                      checked={sel.included}
                      onChange={(e) => setSel(p.id, { included: e.target.checked })}
                    />
                    у складі
                  </label>
                  {sel.included && (
                    <>
                      <select
                        value={sel.isStarting ? "start" : "sub"}
                        onChange={(e) =>
                          setSel(p.id, {
                            isStarting: e.target.value === "start",
                            minutes: e.target.value === "start" ? 90 : sel.minutes,
                          })
                        }
                        className="bg-panel-raised rounded px-1.5 py-1 text-ivory"
                      >
                        <option value="start">Старт</option>
                        <option value="sub">Заміна</option>
                      </select>

                      <label className="flex items-center gap-1 text-muted" title="Капітан">
                        <input
                          type="checkbox"
                          checked={sel.isCaptain}
                          onChange={(e) => setSel(p.id, { isCaptain: e.target.checked })}
                        />
                        C
                      </label>
                      <label className="flex items-center gap-1 text-muted" title="Травма">
                        <input
                          type="checkbox"
                          checked={sel.isInjured}
                          onChange={(e) => setSel(p.id, { isInjured: e.target.checked })}
                        />
                        травма
                      </label>

                      <NumField label="хв" value={sel.minutes} onChange={(v) => setSel(p.id, { minutes: v })} max={120} />
                      <NumField label="голи" value={sel.goals} onChange={(v) => setSel(p.id, { goals: v })} />
                      <NumField label="асисти" value={sel.assists} onChange={(v) => setSel(p.id, { assists: v })} />
                      <NumField label="ЖК" value={sel.yellowCards} onChange={(v) => setSel(p.id, { yellowCards: v })} max={2} />
                      <NumField label="ЧК" value={sel.redCards} onChange={(v) => setSel(p.id, { redCards: v })} max={1} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {msg && <div className="text-xs text-gold-bright mb-2">{msg}</div>}

          <button
            onClick={saveLineup}
            disabled={savingLineup}
            className="rounded-lg bg-panel-raised border border-gold/30 text-gold-bright px-4 py-2 text-xs disabled:opacity-40"
          >
            {savingLineup ? "Зберігаємо…" : "Зберегти склад"}
          </button>
        </div>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-1 text-muted">
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-11 bg-panel-raised rounded px-1 py-1 text-ivory"
      />
      {label}
    </label>
  );
}
