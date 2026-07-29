"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { matchStatusLabel } from "@/lib/display";
import VisualLineupBuilder, { PlayerDetail, emptyDetail } from "./VisualLineupBuilder";

type RosterPlayer = {
  id: string;
  full_name: string;
  short_name?: string | null;
  jersey_number: number | null;
  position: string;
  nationality?: string | null;
  photo_url?: string | null;
};

function buildInitialState(existingLineup: any[]) {
  const slotAssignments: Record<number, string | null> = {};
  const subIds: string[] = [];
  const details: Record<string, PlayerDetail> = {};

  for (const row of existingLineup ?? []) {
    const pid = row.players?.id ?? row.player_id;
    if (!pid) continue;
    if (row.is_starting && row.formation_slot != null) {
      slotAssignments[row.formation_slot] = pid;
    } else if (!row.is_starting) {
      subIds.push(pid);
    }
    details[pid] = {
      isCaptain: !!row.is_captain,
      isInjured: !!row.is_injured,
      goals: row.goals ?? 0,
      assists: row.assists ?? 0,
      yellowCards: row.yellow_cards ?? 0,
      redCards: row.red_cards ?? 0,
      subOutMinute: row.sub_out_minute != null ? String(row.sub_out_minute) : "",
      subInMinute: row.sub_in_minute != null ? String(row.sub_in_minute) : "",
    };
  }
  return { slotAssignments, subIds, details };
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
  const initial = buildInitialState(existingLineup);
  const [slotAssignments, setSlotAssignments] = useState<Record<number, string | null>>(initial.slotAssignments);
  const [subIds, setSubIds] = useState<string[]>(initial.subIds);
  const [details, setDetails] = useState<Record<string, PlayerDetail>>(initial.details);
  const [homeScore, setHomeScore] = useState(match.home_score ?? "");
  const [awayScore, setAwayScore] = useState(match.away_score ?? "");

  const [savingLineup, setSavingLineup] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [openingVoting, setOpeningVoting] = useState(false);
  const [closingVoting, setClosingVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  function setDetail(playerId: string, patch: Partial<PlayerDetail>) {
    setDetails((cur) => ({ ...cur, [playerId]: { ...emptyDetail, ...cur[playerId], ...patch } }));
  }

  async function saveLineup() {
    setSavingLineup(true);
    setMsg("");

    const starters = Object.entries(slotAssignments)
      .filter(([, pid]) => pid)
      .map(([slot, pid]) => ({ playerId: pid as string, formationSlot: Number(slot), isStarting: true }));
    const subs = subIds.map((pid) => ({ playerId: pid, isStarting: false, formationSlot: null }));

    const rows = [...starters, ...subs].map((r) => {
      const d = details[r.playerId] ?? emptyDetail;
      return {
        ...r,
        isCaptain: d.isCaptain,
        isInjured: d.isInjured,
        goals: d.goals,
        assists: d.assists,
        yellowCards: d.yellowCards,
        redCards: d.redCards,
        subOutMinute: d.subOutMinute ? Number(d.subOutMinute) : null,
        subInMinute: d.subInMinute ? Number(d.subInMinute) : null,
      };
    });

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

  async function saveScore() {
    setSavingScore(true);
    setMsg("");
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: homeScore === "" ? null : Number(homeScore),
        awayScore: awayScore === "" ? null : Number(awayScore),
      }),
    });
    setSavingScore(false);
    if (res.ok) {
      setMsg("Рахунок збережено");
      router.refresh();
    }
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

  async function deleteMatch() {
    if (!confirm("Видалити матч повністю (склад і голоси теж)? Це незворотньо.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/matches/${match.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel">
      <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2">
        <Link href={`/matches/${match.id}`} className="text-sm text-ivory hover:text-gold-bright">
          {match.is_home ? "Барселона" : match.opponent_name} —{" "}
          {match.is_home ? match.opponent_name : "Барселона"}
          <span className="text-muted ml-2 text-xs">{matchStatusLabel(match.status)}</span>
        </Link>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder="—"
            className="w-10 bg-panel-raised rounded px-1 py-1 text-xs text-ivory text-center"
          />
          <span className="text-muted text-xs">:</span>
          <input
            type="number"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder="—"
            className="w-10 bg-panel-raised rounded px-1 py-1 text-xs text-ivory text-center"
          />
          <button
            onClick={saveScore}
            disabled={savingScore}
            className="text-[11px] rounded-lg border border-white/10 text-muted px-2 py-1.5 hover:text-ivory disabled:opacity-40"
          >
            {savingScore ? "…" : "рахунок"}
          </button>
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
          <button
            onClick={deleteMatch}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
          >
            {deleting ? "…" : "видалити"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <VisualLineupBuilder
            matchId={match.id}
            roster={roster}
            slotAssignments={slotAssignments}
            setSlotAssignments={setSlotAssignments}
            subIds={subIds}
            setSubIds={setSubIds}
            details={details}
            setDetail={setDetail}
          />

          {msg && <div className="text-xs text-gold-bright my-2">{msg}</div>}

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
