"use client";

import { useState } from "react";
import { FORMATION_SLOTS } from "@/lib/formationSlots";
import { TokenVisual } from "@/components/FormationPitch";

type RosterPlayer = {
  id: string;
  full_name: string;
  short_name?: string | null;
  jersey_number: number | null;
  position: string;
  positions?: string[] | null;
  nationality?: string | null;
  photo_url?: string | null;
};

export type PlayerDetail = {
  isCaptain: boolean;
  isInjured: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  subOutMinute: string; // порожньо = не виходив (відіграв увесь матч)
  subInMinute: string; // на якій хвилині вийшов на поле (заміна)
  subForPlayerId: string; // кого замінив (для замін) — id гравця зі старту
};

export const emptyDetail: PlayerDetail = {
  isCaptain: false,
  isInjured: false,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  subOutMinute: "",
  subInMinute: "",
  subForPlayerId: "",
};

function clampMinute(v: string): string {
  if (v === "") return "";
  const n = Math.max(0, Math.min(90, Number(v) || 0));
  return String(n);
}

export default function VisualLineupBuilder({
  matchId,
  roster,
  slotAssignments,
  setSlotAssignments,
  subIds,
  setSubIds,
  details,
  setDetail,
}: {
  matchId: string;
  roster: RosterPlayer[];
  slotAssignments: Record<number, string | null>;
  setSlotAssignments: (v: Record<number, string | null>) => void;
  subIds: string[];
  setSubIds: (v: string[]) => void;
  details: Record<string, PlayerDetail>;
  setDetail: (playerId: string, patch: Partial<PlayerDetail>) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showAllForSlot, setShowAllForSlot] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  const usedIds = new Set([...Object.values(slotAssignments).filter(Boolean), ...subIds]);
  const startersInSquad = Object.values(slotAssignments).filter(Boolean) as string[];

  function assignSlot(slotIndex: number, playerId: string | null) {
    setSlotAssignments({ ...slotAssignments, [slotIndex]: playerId });
    setActiveSlot(null);
    setShowAllForSlot(false);
  }

  function toggleSub(playerId: string) {
    if (subIds.includes(playerId)) {
      setSubIds(subIds.filter((id) => id !== playerId));
    } else {
      setSubIds([...subIds, playerId]);
    }
  }

  async function duplicatePrevious() {
    setDuplicating(true);
    const res = await fetch(`/api/admin/matches/${matchId}/previous-lineup`);
    const data = await res.json();
    setDuplicating(false);
    if (!res.ok || !data.slots?.length) return;
    const next: Record<number, string | null> = {};
    for (const row of data.slots) next[row.formation_slot] = row.player_id;
    setSlotAssignments(next);
  }

  const playerById = (id: string) => roster.find((p) => p.id === id);

  function playersForSlot(def: (typeof FORMATION_SLOTS)[number]) {
    const filtered = roster.filter(
      (p) => p.position === def.label || p.positions?.includes(def.label)
    );
    const pool = showAllForSlot || filtered.length === 0 ? roster : filtered;
    return pool.filter((p) => !usedIds.has(p.id) || p.id === slotAssignments[def.index]);
  }

  // Автоматично рахуємо пару "хто вийшов / хто зайшов" при зміні хвилини заміни
  function setSubPairing(subPlayerId: string, forPlayerId: string, minute: string) {
    const m = clampMinute(minute);
    setDetail(subPlayerId, { subForPlayerId: forPlayerId, subInMinute: m });
    if (forPlayerId) {
      setDetail(forPlayerId, { subOutMinute: m });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted">Тисни на кружечок, щоб призначити гравця на цю позицію.</p>
        <button
          onClick={duplicatePrevious}
          disabled={duplicating}
          className="text-[11px] rounded-lg border border-gold/30 text-gold-bright px-3 py-1.5 disabled:opacity-40 shrink-0 transition-colors duration-200"
        >
          {duplicating ? "…" : "Продублювати минулу 11"}
        </button>
      </div>

      <div className="relative w-full aspect-[3/5] md:aspect-[16/12] rounded-xl border border-white/10 bg-void/70 mb-4">
        {FORMATION_SLOTS.map((def) => {
          const playerId = slotAssignments[def.index];
          const player = playerId ? playerById(playerId) : null;
          const isActive = activeSlot === def.index;

          return (
            <div
              key={def.index}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${def.x}%`, top: `${def.y}%` }}
            >
              <button
                onClick={() => {
                  setActiveSlot(isActive ? null : def.index);
                  setShowAllForSlot(false);
                }}
              >
                {player ? (
                  <TokenVisual
                    slot={{
                      id: player.id,
                      name: player.full_name,
                      shortName: player.short_name,
                      jersey: player.jersey_number,
                      photoUrl: player.photo_url,
                      nationality: player.nationality,
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center text-white/40 text-2xl transition-colors duration-200 hover:border-gold/50 hover:text-gold/50">
                    +
                  </div>
                )}
              </button>

              {/* Спливаюча панель вибору — з'являється одразу зі списком, без проміжного кроку */}
              <div
                className={`absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 w-40 rounded-lg bg-panel border border-gold/30 shadow-xl transition-all duration-150 origin-top ${
                  isActive ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {player && (
                    <button
                      onClick={() => assignSlot(def.index, null)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/5"
                    >
                      ✕ прибрати
                    </button>
                  )}
                  {playersForSlot(def).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => assignSlot(def.index, p.id)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-ivory hover:bg-white/5 truncate"
                    >
                      {p.jersey_number ?? "—"} {p.full_name}
                    </button>
                  ))}
                  {playersForSlot(def).length === 0 && (
                    <div className="px-3 py-1.5 text-[11px] text-muted">Нікого вільного на цю позицію</div>
                  )}
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 border-t border-white/5 text-[10px] text-muted">
                  <input
                    type="checkbox"
                    checked={showAllForSlot}
                    onChange={(e) => setShowAllForSlot(e.target.checked)}
                  />
                  показати всіх гравців
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="eyebrow mb-2">Заміни</div>
      <div className="flex flex-wrap gap-x-4 gap-y-6 mb-4">
        {roster
          .filter((p) => !Object.values(slotAssignments).includes(p.id))
          .map((p) => {
            const active = subIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSub(p.id)}
                className="transition-transform duration-150"
                style={{ transform: active ? "scale(1)" : "scale(0.95)" }}
              >
                <div className={active ? "" : "opacity-40"}>
                  <TokenVisual
                    slot={{
                      id: p.id,
                      name: p.full_name,
                      shortName: p.short_name,
                      jersey: p.jersey_number,
                      photoUrl: p.photo_url,
                      nationality: p.nationality,
                    }}
                    compact
                  />
                </div>
              </button>
            );
          })}
      </div>

      {subIds.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {subIds.map((subId) => {
            const sub = playerById(subId);
            const d = details[subId] ?? emptyDetail;
            if (!sub) return null;
            return (
              <div key={subId} className="flex flex-wrap items-center gap-2 text-[11px] bg-panel rounded-lg px-3 py-2">
                <span className="text-gold-bright">{sub.full_name}</span>
                <span className="text-muted">замість</span>
                <select
                  value={d.subForPlayerId}
                  onChange={(e) => setSubPairing(subId, e.target.value, d.subInMinute)}
                  className="bg-panel-raised rounded px-1.5 py-1 text-ivory"
                >
                  <option value="">— обери —</option>
                  {startersInSquad.map((sid) => {
                    const starter = playerById(sid);
                    return starter ? (
                      <option key={sid} value={sid}>
                        {starter.full_name}
                      </option>
                    ) : null;
                  })}
                </select>
                <span className="text-muted">на</span>
                <input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="хв"
                  value={d.subInMinute}
                  onChange={(e) => setSubPairing(subId, d.subForPlayerId, e.target.value)}
                  className="w-12 bg-panel-raised rounded px-1.5 py-1 text-ivory"
                />
                хвилині
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-lg border border-white/5">
        {[...startersInSquad, ...subIds].map((id) => {
          const p = playerById(id);
          if (!p) return null;
          const isSub = subIds.includes(p.id);
          const d = details[p.id] ?? emptyDetail;
          return (
            <div key={p.id} className="border-b border-white/5 last:border-0 px-3 py-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-ivory">
                  {p.jersey_number ?? "—"} {p.full_name} {isSub && <span className="eyebrow ml-1">заміна</span>}
                </span>
                <button
                  onClick={() => setExpandedId((cur) => (cur === p.id ? null : p.id))}
                  className="text-muted hover:text-ivory transition-colors duration-150"
                >
                  {expandedId === p.id ? "▲" : "деталі ▾"}
                </button>
              </div>
              <div
                className={`grid transition-all duration-200 ${
                  expandedId === p.id ? "grid-rows-[1fr] opacity-100 mt-1.5" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pb-1">
                    <label className="flex items-center gap-1 text-muted">
                      <input
                        type="checkbox"
                        checked={d.isCaptain}
                        onChange={(e) => setDetail(p.id, { isCaptain: e.target.checked })}
                      />
                      капітан
                    </label>
                    <label className="flex items-center gap-1 text-muted">
                      <input
                        type="checkbox"
                        checked={d.isInjured}
                        onChange={(e) => setDetail(p.id, { isInjured: e.target.checked })}
                      />
                      травма
                    </label>
                    <MiniNum label="голи" value={d.goals} onChange={(v) => setDetail(p.id, { goals: v })} />
                    <MiniNum label="асисти" value={d.assists} onChange={(v) => setDetail(p.id, { assists: v })} />
                    <MiniNum label="ЖК" value={d.yellowCards} onChange={(v) => setDetail(p.id, { yellowCards: v })} max={2} />
                    <MiniNum label="ЧК" value={d.redCards} onChange={(v) => setDetail(p.id, { redCards: v })} max={1} />
                    {!isSub && (
                      <span className="text-muted">
                        {d.subOutMinute ? `вийшов на ${d.subOutMinute} хв` : "відіграв увесь матч"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniNum({
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
        className="w-10 bg-panel-raised rounded px-1 py-1 text-ivory"
      />
      {label}
    </label>
  );
}
