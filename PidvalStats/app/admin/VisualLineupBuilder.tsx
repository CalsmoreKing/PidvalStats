"use client";

import { useState } from "react";
import { FORMATION_SLOTS } from "@/lib/formationSlots";
import { TokenVisual } from "@/components/FormationPitch";
import { BallIcon, BootIcon } from "@/components/icons";

type RosterPlayer = {
  id: string;
  full_name: string;
  short_name?: string | null;
  jersey_number: number | null;
  position: string;
  positions?: string[] | null;
  nationality?: string | null;
  photo_url?: string | null;
  photo_focus_x?: number | null;
  photo_focus_y?: number | null;
  photo_zoom?: number | null;
};

export type PlayerDetail = {
  isCaptain: boolean;
  isInjured: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  subOutMinute: string; // порожньо = не виходив (відіграв увесь матч)
  subInMinute: string; // на якій хвилині вийшов на поле (заміна)
  subForPlayerId: string; // кого замінив (для замін) — id гравця зі старту
  funFact: string; // кожен рядок — окремий факт, показуються карткою після матчу
};

export const emptyDetail: PlayerDetail = {
  isCaptain: false,
  isInjured: false,
  goals: 0,
  penaltyGoals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  subOutMinute: "",
  subInMinute: "",
  subForPlayerId: "",
  funFact: "",
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
  const [slotSearch, setSlotSearch] = useState("");
  const [showAllForSub, setShowAllForSub] = useState<Set<string>>(new Set());
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
    const eligible = (pool: typeof roster) =>
      pool.filter((p) => !usedIds.has(p.id) || p.id === slotAssignments[def.index]);

    // Якщо щось введено в пошук — шукаємо серед УСІХ вільних гравців, а не
    // лише за позицією: якщо друкуєш ім'я, значить точно знаєш кого шукати.
    const q = slotSearch.trim().toLowerCase();
    if (q) {
      return eligible(roster).filter((p) => p.full_name.toLowerCase().includes(q));
    }

    const filtered = roster.filter(
      (p) => p.position === def.label || p.positions?.includes(def.label)
    );
    const pool = showAllForSlot || filtered.length === 0 ? roster : filtered;
    return eligible(pool);
  }

  // Автоматично рахуємо пару "хто вийшов / хто зайшов" при зміні хвилини заміни
  // Лише один капітан на весь склад — знімаємо позначку з усіх інших
  function setCaptain(playerId: string) {
    const makingCaptain = !(details[playerId]?.isCaptain ?? false);
    const allIds = [...startersInSquad, ...subIds];
    for (const id of allIds) {
      if (id === playerId) {
        setDetail(id, { isCaptain: makingCaptain });
      } else if (details[id]?.isCaptain) {
        setDetail(id, { isCaptain: false });
      }
    }
  }

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
        <p></p>
        <button
          onClick={duplicatePrevious}
          disabled={duplicating}
          className="text-[11px] rounded-lg border border-gold/30 text-gold-bright px-3 py-1.5 disabled:opacity-40 shrink-0 transition-colors duration-200"
        >
          {duplicating ? "…" : "Продублювати минулу 11"}
        </button>
      </div>

      <div className="relative w-full max-w-md md:max-w-2xl mx-auto aspect-[2/3] rounded-xl border border-white/10 bg-void/70 mb-4">
        {FORMATION_SLOTS.map((def) => {
          const playerId = slotAssignments[def.index];
          const player = playerId ? playerById(playerId) : null;
          const isActive = activeSlot === def.index;

          return (
            <div
              key={def.index}
              // z-index: кожен слот через -translate-x/y отримує власний stacking
              // context (transform завжди створює новий), тому z-50 на самій
              // випадаючій панелі раніше порівнювався лише "локально" й програвав
              // сусідньому слоту, що йшов пізніше в DOM (з уже призначеним гравцем).
              // Піднімаємо весь активний слот цілком — тоді порівняння йде на
              // рівні сусідніх слотів, а не всередині одного з них.
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${isActive ? "z-50" : "z-0"}`}
              style={{ left: `${def.x}%`, top: `${def.y}%` }}
            >
              <button
                onClick={() => {
                  setActiveSlot(isActive ? null : def.index);
                  setShowAllForSlot(false);
                  setSlotSearch("");
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
                      photoFocusX: player.photo_focus_x,
                      photoFocusY: player.photo_focus_y,
                      photoZoom: player.photo_zoom,
                      nationality: player.nationality,
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center text-white/40 text-2xl transition-colors duration-200 hover:border-gold/50 hover:text-gold/50">
                    +
                  </div>
                )}
              </button>

              {/* Спливаюча панель вибору — з'являється одразу зі списком, без проміжного кроку.
                  Для нижньої половини поля відкриваємо ВГОРУ, щоб не залазити на заміни знизу. */}
              <div
                className={`absolute z-50 ${
                  def.y > 55 ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top"
                } left-1/2 -translate-x-1/2 w-44 rounded-lg border border-gold/40 shadow-2xl transition-all duration-150 ${
                  isActive ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                }`}
                style={{ backgroundColor: "#0F0A1C" }}
              >
                <div className="px-2 pt-2 pb-1">
                  <input
                    type="text"
                    value={slotSearch}
                    onChange={(e) => setSlotSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Пошук за іменем…"
                    className="w-full bg-panel-raised rounded px-2 py-1 text-[11px] text-ivory placeholder:text-muted outline-none"
                  />
                </div>
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
                    <div className="px-3 py-1.5 text-[11px] text-muted">
                      {slotSearch.trim() ? "Нічого не знайдено" : "Нікого вільного на цю позицію"}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 border-t border-white/5 text-[10px] text-muted">
                  <input
                    type="checkbox"
                    checked={showAllForSlot}
                    onChange={(e) => setShowAllForSlot(e.target.checked)}
                  />
                  Показати всіх гравців
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
                      photoFocusX: p.photo_focus_x,
                      photoFocusY: p.photo_focus_y,
                      photoZoom: p.photo_zoom,
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

            // Уже "зайняті" іншими замінами старт-гравці — щоб двоє не вийшли за одного
            const claimedByOthers = new Set(
              subIds
                .filter((id) => id !== subId)
                .map((id) => details[id]?.subForPlayerId)
                .filter(Boolean)
            );
            const candidateStarters = startersInSquad.filter((sid) => {
              const starter = playerById(sid);
              if (!starter) return false;
              if (claimedByOthers.has(sid)) return false;
              if (showAllForSub.has(subId)) return true;
              return starter.position === sub.position || sid === d.subForPlayerId;
            });

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
                  {candidateStarters.map((sid) => {
                    const starter = playerById(sid);
                    return starter ? (
                      <option key={sid} value={sid}>
                        {starter.full_name}
                      </option>
                    ) : null;
                  })}
                </select>
                <label className="flex items-center gap-1 text-[10px] text-muted">
                  <input
                    type="checkbox"
                    checked={showAllForSub.has(subId)}
                    onChange={(e) =>
                      setShowAllForSub((cur) => {
                        const next = new Set(cur);
                        e.target.checked ? next.add(subId) : next.delete(subId);
                        return next;
                      })
                    }
                  />
                  Показати всіх
                </label>
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
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} className="border-b border-white/5 last:border-0 px-3 py-1.5">
              <button
                onClick={() => setExpandedId(isOpen ? null : p.id)}
                className="flex items-center gap-2 text-xs w-full text-left"
              >
                <span className="flex-1 truncate text-ivory">
                  {p.jersey_number ?? "—"} {p.full_name} {isSub && <span className="eyebrow ml-1">заміна</span>}
                  {d.isCaptain && <span className="ml-1">©️</span>}
                  {d.isInjured && <span className="ml-1">🤕</span>}
                </span>
                <span className="text-muted">{isOpen ? "▲" : "▾"}</span>
              </button>
              <div
                className={`grid transition-all duration-200 ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-1.5" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pb-1">
                    <IconToggle
                      icon="©️"
                      title="Капітан"
                      active={d.isCaptain}
                      onClick={() => setCaptain(p.id)}
                    />
                    <IconToggle
                      icon="🤕"
                      title="Травма"
                      active={d.isInjured}
                      onClick={() => setDetail(p.id, { isInjured: !d.isInjured })}
                    />
                    <MiniNum icon={<BallIcon className="h-3.5 w-3.5" />} value={d.goals} onChange={(v) => setDetail(p.id, { goals: v })} />
                    <MiniNum
                      icon={<span className="text-[10px] font-bold text-muted">пен</span>}
                      value={d.penaltyGoals}
                      onChange={(v) => setDetail(p.id, { penaltyGoals: v })}
                      max={d.goals}
                    />
                    <MiniNum icon={<BootIcon className="h-3.5 w-3.5" />} value={d.assists} onChange={(v) => setDetail(p.id, { assists: v })} />
                    <MiniNum icon="🟨" value={d.yellowCards} onChange={(v) => setDetail(p.id, { yellowCards: v })} max={2} />
                    <MiniNum icon="🟥" value={d.redCards} onChange={(v) => setDetail(p.id, { redCards: v })} max={1} />
                    <textarea
                      value={d.funFact}
                      onChange={(e) => setDetail(p.id, { funFact: e.target.value })}
                      placeholder={"Факти про гравця, кожен з нового рядка\nнапр. Найбільше ключових передач — 8"}
                      rows={2}
                      className="flex-1 min-w-[220px] bg-panel-raised rounded px-2 py-1 text-ivory placeholder:text-muted/60 outline-none resize-y"
                    />
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
  icon,
  value,
  onChange,
  max = 20,
}: {
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-1 text-muted">
      <span className="flex items-center justify-center w-3.5 shrink-0">{icon}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 bg-panel-raised rounded px-1 py-1 text-ivory"
      />
    </label>
  );
}

function IconToggle({
  icon,
  active,
  onClick,
  title,
}: {
  icon: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 w-7 rounded flex items-center justify-center transition-all duration-150 ${
        active ? "bg-gold/30 ring-1 ring-gold/60" : "bg-panel-raised opacity-40 hover:opacity-70"
      }`}
    >
      {icon}
    </button>
  );
}
