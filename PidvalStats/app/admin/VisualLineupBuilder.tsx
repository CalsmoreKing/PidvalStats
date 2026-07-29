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
  subInMinute: string; // для замін: на якій хвилині вийшов на поле
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
};

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  const usedIds = new Set([...Object.values(slotAssignments).filter(Boolean), ...subIds]);

  function assignSlot(slotIndex: number, playerId: string | null) {
    setSlotAssignments({ ...slotAssignments, [slotIndex]: playerId });
    setActiveSlot(null);
  }

  function toggleSub(playerId: string) {
    setSubIds(subIds.includes(playerId) ? subIds.filter((id) => id !== playerId) : [...subIds, playerId]);
  }

  async function duplicatePrevious() {
    setDuplicating(true);
    const res = await fetch(`/api/admin/matches/${matchId}/previous-lineup`);
    const data = await res.json();
    setDuplicating(false);
    if (!res.ok || !data.slots?.length) return;
    const next: Record<number, string | null> = {};
    for (const row of data.slots) {
      next[row.formation_slot] = row.player_id;
    }
    setSlotAssignments(next);
  }

  const playerById = (id: string) => roster.find((p) => p.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted">Тисни на кружечок, щоб призначити гравця на цю позицію.</p>
        <button
          onClick={duplicatePrevious}
          disabled={duplicating}
          className="text-[11px] rounded-lg border border-gold/30 text-gold-bright px-3 py-1.5 disabled:opacity-40 shrink-0"
        >
          {duplicating ? "…" : "Продублювати минулу 11"}
        </button>
      </div>

      <div className="relative w-full aspect-[3/4] md:aspect-[16/9] rounded-xl border border-white/10 bg-panel/60 mb-4">
        {FORMATION_SLOTS.map((def) => {
          const playerId = slotAssignments[def.index];
          const player = playerId ? playerById(playerId) : null;

          return (
            <div
              key={def.index}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${def.x}%`, top: `${def.y}%` }}
            >
              {activeSlot === def.index ? (
                <select
                  autoFocus
                  value={playerId ?? ""}
                  onChange={(e) => assignSlot(def.index, e.target.value || null)}
                  onBlur={() => setActiveSlot(null)}
                  className="bg-panel-raised border border-gold/40 rounded text-[11px] text-ivory px-1 py-1 w-28"
                >
                  <option value="">— порожньо —</option>
                  {roster
                    .filter((p) => !usedIds.has(p.id) || p.id === playerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.jersey_number ?? "—"} {p.full_name}
                      </option>
                    ))}
                </select>
              ) : player ? (
                <button onClick={() => setActiveSlot(def.index)}>
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
                </button>
              ) : (
                <button
                  onClick={() => setActiveSlot(def.index)}
                  className="h-16 w-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-2xl hover:border-gold/50 hover:text-gold/50"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="eyebrow mb-2">Заміни</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {roster
          .filter((p) => !Object.values(slotAssignments).includes(p.id))
          .map((p) => {
            const active = subIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSub(p.id)}
                className={`text-[11px] rounded-full px-3 py-1.5 border ${
                  active ? "bg-gold/30 border-gold/50 text-gold-bright" : "border-white/10 text-muted"
                }`}
              >
                {p.jersey_number ?? "—"} {p.full_name}
              </button>
            );
          })}
      </div>

      {/* Деталі (капітан/травма/голи/картки/хвилини) — по гравцю зі складу */}
      <div className="eyebrow mb-2">Деталі гравців у складі</div>
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-lg border border-white/5">
        {[...Object.values(slotAssignments).filter(Boolean), ...subIds].map((id) => {
          const p = playerById(id as string);
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
                  className="text-muted hover:text-ivory"
                >
                  {expandedId === p.id ? "▲" : "деталі ▾"}
                </button>
              </div>
              {expandedId === p.id && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
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
                    <label className="flex items-center gap-1 text-muted">
                      вийшов на
                      <input
                        type="number"
                        placeholder="90"
                        value={d.subOutMinute}
                        onChange={(e) => setDetail(p.id, { subOutMinute: e.target.value })}
                        className="w-11 bg-panel-raised rounded px-1 py-1 text-ivory"
                      />
                      хв (пусто = увесь матч)
                    </label>
                  )}
                  {isSub && (
                    <label className="flex items-center gap-1 text-muted">
                      вийшов на поле на
                      <input
                        type="number"
                        placeholder="—"
                        value={d.subInMinute}
                        onChange={(e) => setDetail(p.id, { subInMinute: e.target.value })}
                        className="w-11 bg-panel-raised rounded px-1 py-1 text-ivory"
                      />
                      хв
                    </label>
                  )}
                </div>
              )}
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
