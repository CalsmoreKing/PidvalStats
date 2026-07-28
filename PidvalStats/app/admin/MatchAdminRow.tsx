"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { matchStatusLabel } from "@/lib/display";

type RosterPlayer = {
  id: string;
  full_name: string;
  jersey_number: number | null;
  position: string;
};

type Squad = "none" | "start" | "sub";

type Selection = {
  squad: Squad;
  isCaptain: boolean;
  isInjured: boolean;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  subInMinute: string;
  subOutMinute: string;
};

const emptySel: Selection = {
  squad: "none",
  isCaptain: false,
  isInjured: false,
  minutes: 90,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  subInMinute: "",
  subOutMinute: "",
};

function buildInitialSelections(existingLineup: any[]): Record<string, Selection> {
  const map: Record<string, Selection> = {};
  for (const row of existingLineup ?? []) {
    const pid = row.players?.id ?? row.player_id;
    if (!pid) continue;
    map[pid] = {
      squad: row.is_starting ? "start" : "sub",
      isCaptain: !!row.is_captain,
      isInjured: !!row.is_injured,
      minutes: row.minutes_played ?? (row.is_starting ? 90 : 0),
      goals: row.goals ?? 0,
      assists: row.assists ?? 0,
      yellowCards: row.yellow_cards ?? 0,
      redCards: row.red_cards ?? 0,
      subInMinute: row.sub_in_minute != null ? String(row.sub_in_minute) : "",
      subOutMinute: row.sub_out_minute != null ? String(row.sub_out_minute) : "",
    };
  }
  return map;
}

export default function MatchAdminRow({
  match,
  roster,
  existingLineup,
}: {
  match: any;
  roster: RosterPlayer[];
  existingLineup: any[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    buildInitialSelections(existingLineup)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingLineup, setSavingLineup] = useState(false);
  const [openingVoting, setOpeningVoting] = useState(false);
  const [closingVoting, setClosingVoting] = useState(false);
  const [msg, setMsg] = useState("");

  function setSel(playerId: string, patch: Partial<Selection>) {
    setSelections((cur) => ({
      ...cur,
      [playerId]: { ...emptySel, ...cur[playerId], ...patch },
    }));
  }

  function cycleSquad(playerId: string) {
    const cur = selections[playerId]?.squad ?? "none";
    const next: Squad = cur === "none" ? "start" : cur === "start" ? "sub" : "none";
    setSel(playerId, {
      squad: next,
      minutes: next === "start" ? 90 : next === "sub" ? 0 : 0,
    });
  }

  async function saveLineup() {
    setSavingLineup(true);
    setMsg("");
    const rows = Object.entries(selections)
      .filter(([, s]) => s.squad !== "none")
      .map(([playerId, s]) => ({
        playerId,
        isStarting: s.squad === "start",
        isCaptain: s.isCaptain,
        isInjured: s.isInjured,
        minutesPlayed: s.minutes,
        goals: s.goals,
        assists: s.assists,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
        subInMinute: s.subInMinute ? Number(s.subInMinute) : null,
        subOutMinute: s.subOutMinute ? Number(s.subOutMinute) : null,
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

  async function closeVoting() {
    if (!confirm("Закрити голосування й підрахувати результати зараз?")) return;
    setClosingVoting(true);
    setMsg("");
    const res = await fetch(`/api/admin/matches/${match.id}/close-voting`, { method: "POST" });
    const data = await res.json();
    setClosingVoting(false);
    if (!res.ok) {
      setMsg(data.error ?? "Помилка закриття голосування");
      return;
    }
    setMsg("Голосування закрито, результати підраховано");
    router.refresh();
  }

  const squadLabel: Record<Squad, string> = { none: "—", start: "СТАРТ", sub: "ЗАМІНА" };
  const squadColor: Record<Squad, string> = {
    none: "bg-panel-raised text-muted",
    start: "bg-gold text-void",
    sub: "bg-gold/30 text-gold-bright",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-panel">
      <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2">
        <Link href={`/matches/${match.id}`} className="text-sm text-ivory hover:text-gold-bright">
          {match.is_home ? "Барселона" : match.opponent_name} —{" "}
          {match.is_home ? match.opponent_name : "Барселона"}
          <span className="text-muted ml-2 text-xs">{matchStatusLabel(match.status)}</span>
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
          {match.status === "voting_open" && (
            <button
              onClick={closeVoting}
              disabled={closingVoting}
              className="text-xs rounded-lg bg-red-500/80 text-white px-3 py-1.5 font-medium disabled:opacity-40"
            >
              {closingVoting ? "…" : "Закрити голосування"}
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
          <p className="text-[11px] text-muted mb-3">
            Тисни на гравця: перший тап — старт, другий — заміна, третій — прибрати зі складу.
          </p>
          <div className="max-h-[28rem] overflow-y-auto flex flex-col gap-1 mb-3">
            {roster.map((p) => {
              const sel = selections[p.id] ?? emptySel;
              const inSquad = sel.squad !== "none";
              return (
                <div key={p.id} className="border-b border-white/5 pb-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => cycleSquad(p.id)}
                      className={`w-16 shrink-0 rounded px-1.5 py-1 font-utility text-[10px] ${squadColor[sel.squad]}`}
                    >
                      {squadLabel[sel.squad]}
                    </button>
                    <span className="w-6 text-muted">{p.jersey_number ?? "—"}</span>
                    <span className="flex-1 truncate text-ivory">{p.full_name}</span>
                    {inSquad && (
                      <button
                        onClick={() => setExpandedId((cur) => (cur === p.id ? null : p.id))}
                        className="text-muted hover:text-ivory px-1"
                        title="Деталі: хвилини, голи, картки"
                      >
                        {expandedId === p.id ? "▲" : "деталі ▾"}
                      </button>
                    )}
                  </div>

                  {inSquad && expandedId === p.id && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-[4.5rem] text-[11px]">
                      <label className="flex items-center gap-1 text-muted">
                        <input
                          type="checkbox"
                          checked={sel.isCaptain}
                          onChange={(e) => setSel(p.id, { isCaptain: e.target.checked })}
                        />
                        капітан
                      </label>
                      <label className="flex items-center gap-1 text-muted">
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
                      {sel.squad === "start" && (
                        <label className="flex items-center gap-1 text-muted">
                          вийшов на
                          <input
                            type="number"
                            placeholder="хв"
                            value={sel.subOutMinute}
                            onChange={(e) => setSel(p.id, { subOutMinute: e.target.value })}
                            className="w-11 bg-panel-raised rounded px-1 py-1 text-ivory"
                          />
                        </label>
                      )}
                      {sel.squad === "sub" && (
                        <label className="flex items-center gap-1 text-muted">
                          вийшов з лави на
                          <input
                            type="number"
                            placeholder="хв"
                            value={sel.subInMinute}
                            onChange={(e) => setSel(p.id, { subInMinute: e.target.value })}
                            className="w-11 bg-panel-raised rounded px-1 py-1 text-ivory"
                          />
                        </label>
                      )}
                    </div>
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
