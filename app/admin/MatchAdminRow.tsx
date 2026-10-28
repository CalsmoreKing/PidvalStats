"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { matchStatusLabel } from "@/lib/display";
import VisualLineupBuilder, { PlayerDetail, emptyDetail } from "./VisualLineupBuilder";
import StaffPicker from "./StaffPicker";
import { VOTING_HOURS } from "@/lib/voting";

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
      penaltyGoals: row.penalty_goals ?? 0,
      assists: row.assists ?? 0,
      yellowCards: row.yellow_cards ?? 0,
      redCards: row.red_cards ?? 0,
      subOutMinute: row.sub_out_minute != null ? String(row.sub_out_minute) : "",
      subInMinute: row.sub_in_minute != null ? String(row.sub_in_minute) : "",
      subForPlayerId: row.sub_for_player_id ?? "",
      funFact: row.fun_fact ?? "",
    };
  }
  return { slotAssignments, subIds, details };
}

export default function MatchAdminRow({
  match,
  roster,
  existingLineup,
  competitions,
  referees,
  coaches,
}: {
  match: any;
  roster: RosterPlayer[];
  existingLineup: any[];
  competitions: { id: string; name: string }[];
  referees: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const initial = buildInitialState(existingLineup);
  const [slotAssignments, setSlotAssignments] = useState<Record<number, string | null>>(initial.slotAssignments);
  const [subIds, setSubIds] = useState<string[]>(initial.subIds);
  const [details, setDetails] = useState<Record<string, PlayerDetail>>(initial.details);
  const [homeScore, setHomeScore] = useState(match.home_score ?? "");
  const [awayScore, setAwayScore] = useState(match.away_score ?? "");
  const [venue, setVenue] = useState(match.venue ?? "");
  const [refereeSelId, setRefereeSelId] = useState(match.referee_id ?? "");
  const [refereeNewName, setRefereeNewName] = useState("");
  const [coachSelId, setCoachSelId] = useState(match.coach_id ?? "");
  const [coachNewName, setCoachNewName] = useState("");
  const [competitionId, setCompetitionId] = useState(match.competition_id ?? "");
  // datetime-local показує ЛОКАЛЬНИЙ час браузера. Раніше сюди клали UTC
  // (toISOString().slice(0,16)), а при збереженні читали як локальний — тож
  // кожне збереження «Деталей» зсувало матч на різницю поясів (−2 год).
  // Заповнюємо в useEffect, бо сервер (UTC) і браузер мають різні пояси —
  // інакше hydration mismatch.
  const [matchDate, setMatchDate] = useState("");
  const [votingOpensAt, setVotingOpensAt] = useState("");
  useEffect(() => {
    setMatchDate(match.match_date ? toLocalInput(match.match_date) : "");
    setVotingOpensAt(match.voting_opens_at ? toLocalInput(match.voting_opens_at) : "");
  }, [match.match_date, match.voting_opens_at]);
  const [isExtraTime, setIsExtraTime] = useState(match.is_extra_time ?? false);
  const [opponentName, setOpponentName] = useState(match.opponent_name ?? "");
  const [opponentCrestUrl, setOpponentCrestUrl] = useState(match.opponent_crest_url ?? "");
  const [isHome, setIsHome] = useState(match.is_home ?? true);

  const [savingLineup, setSavingLineup] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [openingVoting, setOpeningVoting] = useState(false);
  const [closingVoting, setClosingVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
        penaltyGoals: d.penaltyGoals,
        assists: d.assists,
        yellowCards: d.yellowCards,
        redCards: d.redCards,
        subOutMinute: d.subOutMinute ? Number(d.subOutMinute) : null,
        subInMinute: d.subInMinute ? Number(d.subInMinute) : null,
        funFact: d.funFact || null,
        subForPlayerId: d.subForPlayerId || null,
      };
    });

    const res = await fetch("/api/admin/lineup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, lineup: rows, isExtraTime }),
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
    setMsg(`Голосування відкрито на ${VOTING_HOURS} години`);
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

  async function reopenVoting() {
    if (!confirm(`Знову відкрити голосування на ${VOTING_HOURS} години? Уже здані голоси нікуди не зникнуть, а фанати зможуть їх змінити.`)) return;
    setClosingVoting(true);
    setMsg("");
    const res = await fetch(`/api/admin/matches/${match.id}/reopen-voting`, { method: "POST" });
    const data = await res.json();
    setClosingVoting(false);
    if (!res.ok) {
      setMsg(data.error ?? "Помилка повторного відкриття");
      return;
    }
    setMsg(`Голосування знову відкрите на ${VOTING_HOURS} години`);
    router.refresh();
  }

  async function saveDetails() {
    setSavingDetails(true);
    setMsg("");
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venue,
        refereeId: refereeSelId && refereeSelId !== "__new__" ? refereeSelId : null,
        referee: refereeSelId === "__new__" ? refereeNewName : undefined,
        coachId: coachSelId && coachSelId !== "__new__" ? coachSelId : null,
        coachName: coachSelId === "__new__" ? coachNewName : undefined,
        competitionId,
        matchDate: matchDate ? new Date(matchDate).toISOString() : match.match_date,
        votingOpensAt: votingOpensAt ? new Date(votingOpensAt).toISOString() : null,
        isExtraTime,
        opponentName,
        opponentCrestUrl,
        isHome,
      }),
    });
    setSavingDetails(false);
    if (res.ok) {
      setMsg("Деталі матчу збережено");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Не вдалось зберегти деталі");
    }
  }

  async function toggleCancel() {
    const next = !match.is_cancelled;
    if (!confirm(next ? "Позначити матч скасованим?" : "Відновити матч?")) return;
    setCancelling(true);
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCancelled: next }),
    });
    setCancelling(false);
    if (res.ok) router.refresh();
  }

  async function deleteMatch() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/matches/${match.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteArmed(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel">
      <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2">
        <Link href={`/matches/${match.id}`} className="text-sm text-ivory hover:text-gold-bright">
          {match.is_home ? "Барселона" : match.opponent_name} —{" "}
          {match.is_home ? match.opponent_name : "Барселона"}
          <span className="text-muted ml-2 text-xs">{matchStatusLabel(match.status, match.match_date)}</span>
        </Link>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value.replace("-", ""))}
            onBlur={saveScore}
            placeholder="—"
            className="w-10 bg-panel-raised rounded px-1 py-1 text-xs text-ivory text-center"
          />
          <span className="text-muted text-xs">:</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value.replace("-", ""))}
            onBlur={saveScore}
            placeholder="—"
            className="w-10 bg-panel-raised rounded px-1 py-1 text-xs text-ivory text-center"
          />
          {savingScore && <span className="text-[10px] text-muted">…</span>}
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
          {match.status === "finalized" && (
            <button
              onClick={reopenVoting}
              disabled={closingVoting}
              className="text-xs rounded-lg border border-gold/40 text-gold-bright px-3 py-1.5 font-medium disabled:opacity-40"
            >
              {closingVoting ? "…" : "Відкрити знову"}
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs rounded-lg border border-white/10 text-muted px-3 py-1.5 hover:text-ivory"
          >
            {open ? "Сховати склад" : "Склад"}
          </button>
          <button
            onClick={() => setEditOpen((v) => !v)}
            className="text-xs rounded-lg border border-white/10 text-muted px-3 py-1.5 hover:text-ivory"
          >
            {editOpen ? "Сховати деталі" : "Деталі"}
          </button>
          <button
            onClick={toggleCancel}
            disabled={cancelling}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
          >
            {cancelling ? "…" : match.is_cancelled ? "відновити" : "скасувати"}
          </button>
          <button
            onClick={deleteMatch}
            disabled={deleting}
            className={`text-xs disabled:opacity-40 transition-colors duration-150 ${
              deleteArmed ? "text-red-300 font-bold" : "text-red-400 hover:text-red-300"
            }`}
          >
            {deleting ? "…" : deleteArmed ? "Точно видалити?" : "видалити"}
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ${
          editOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden border-t border-white/5 px-4 py-4">
          {/* 1) Два однакові поля часу на одному рівні — підписи зверху, пояснення знизу */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Початок матчу" hint="Дата й час кікоффу — за твоїм годинником.">
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field
              label="Відкриття голосування"
              hint="Автоматично — старт + 90 хв. Підправ, якщо буде додатковий час."
            >
              <input
                type="datetime-local"
                value={votingOpensAt}
                onChange={(e) => setVotingOpensAt(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ivory mt-3">
            <input type="checkbox" checked={isExtraTime} onChange={(e) => setIsExtraTime(e.target.checked)} />
            Був додатковий час (120 хв замість 90)
          </label>

          <div className="h-px bg-white/5 my-4" />

          {/* 2) Суперник + герб (його раніше не можна було змінити після створення) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Суперник">
              <input
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Напр. Реал Мадрид"
                className={inputCls}
              />
            </Field>
            <Field label="Герб суперника (URL)" hint="Пряме посилання на зображення — PNG або SVG.">
              <div className="flex items-center gap-2">
                <input
                  value={opponentCrestUrl}
                  onChange={(e) => setOpponentCrestUrl(e.target.value)}
                  placeholder="https://…"
                  className={`${inputCls} flex-1 min-w-0`}
                />
                <div className="h-9 w-9 shrink-0 rounded-lg bg-panel-raised flex items-center justify-center overflow-hidden">
                  {opponentCrestUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opponentCrestUrl} alt="" className="h-7 w-7 object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted">—</span>
                  )}
                </div>
              </div>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ivory mt-3">
            <input type="checkbox" checked={isHome} onChange={(e) => setIsHome(e.target.checked)} />
            Домашній матч
          </label>

          <div className="h-px bg-white/5 my-4" />

          {/* 3) Рівна сітка 2×2: Турнір · Стадіон / Тренер · Суддя */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Турнір"
              hint={
                match.round_number != null && match.competitions?.round_label
                  ? `${match.competitions.round_label} ${match.round_number} — номер рахується автоматично`
                  : undefined
              }
            >
              <select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className={inputCls}>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Стадіон">
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Напр. Камп Ноу"
                className={inputCls}
              />
            </Field>
            <Field label="Тренер">
              <StaffPicker
                label="Тренер"
                newLabel="новий тренер"
                staff={coaches}
                selectedId={coachSelId}
                onSelectId={setCoachSelId}
                newName={coachNewName}
                onNewName={setCoachNewName}
              />
            </Field>
            <Field label="Суддя">
              <StaffPicker
                label="Суддя"
                newLabel="новий суддя"
                staff={referees}
                selectedId={refereeSelId}
                onSelectId={setRefereeSelId}
                newName={refereeNewName}
                onNewName={setRefereeNewName}
              />
            </Field>
          </div>
          {msg && editOpen && <div className="text-xs text-gold-bright mt-3">{msg}</div>}
          <button
            onClick={saveDetails}
            disabled={savingDetails}
            className="mt-3 rounded-lg bg-panel-raised border border-gold/30 text-gold-bright px-4 py-2 text-xs disabled:opacity-40"
          >
            {savingDetails ? "Зберігаємо…" : "Зберегти деталі"}
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden border-t border-white/5 px-4 py-4">
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
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none focus:ring-1 focus:ring-gold/40";

// Підпис зверху + (необов'язковий) опис знизу — щоб у вікні завжди було видно,
// ЩО саме в ньому вписано («Стадіон» → «Месталья»), а не просто голе слово.
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-muted px-1 leading-snug">{hint}</span>}
    </div>
  );
}

// ISO (UTC) → "YYYY-MM-DDTHH:mm" у локальному часі браузера для <input type="datetime-local">
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
