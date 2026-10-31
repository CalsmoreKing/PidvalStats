"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VoterLite, rankVoters, voterLabel } from "@/lib/award";

// Пошук акаунта фаната: пишеш ім'я (або @нік) — зверху «Найкращий збіг»,
// нижче решта за схожістю. Без запиту підказки беруться з імені номінанта.
export default function VoterPicker({
  nomineeName,
  voters,
  takenIds,
  selectedId,
  onPick,
}: {
  nomineeName: string;
  voters: VoterLite[];
  takenIds: Set<string>; // акаунти, вже прив'язані до інших номінантів
  selectedId: string | null;
  onPick: (voterId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const selected = voters.find((v) => v.id === selectedId) ?? null;

  useEffect(() => {
    function away(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const ranked = useMemo(() => {
    if (!open) return [];
    const query = q.trim() || nomineeName;
    const all = rankVoters(query, voters).filter((r) => r.voter.id !== selectedId);
    const typed = q.trim().length > 0;
    // З запитом показуємо все, що хоч трохи схоже (або містить текст); без
    // запиту — лише справді близькі до імені номінанта.
    return all.filter((r) => (typed ? r.score >= 0.3 : r.score >= 0.45)).slice(0, 8);
  }, [open, q, nomineeName, voters, selectedId]);

  const best = ranked[0] && ranked[0].score >= 0.6 ? ranked[0] : null;
  const rest = best ? ranked.slice(1) : ranked;

  const row = (v: VoterLite, score?: number, isBest = false) => (
    <button
      key={v.id}
      type="button"
      onClick={() => {
        onPick(v.id);
        setOpen(false);
        setQ("");
      }}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-panel-raised ${isBest ? "bg-gold/10" : ""}`}
    >
      <span className="truncate text-sm text-ivory">{voterLabel(v)}</span>
      {v.telegram_username && <span className="text-[11px] text-muted truncate">@{v.telegram_username}</span>}
      {takenIds.has(v.id) && <span className="text-[10px] text-red-300 ml-auto shrink-0">вже в іншого</span>}
      {score != null && !takenIds.has(v.id) && (
        <span className="ml-auto text-[10px] text-muted shrink-0">{Math.round(score * 100)}%</span>
      )}
    </button>
  );

  return (
    <div ref={box} className="relative min-w-0">
      {selected && !open ? (
        <div className="flex items-center gap-2 bg-panel-raised rounded-lg px-3 py-2 text-sm">
          <span className="text-green-400 text-xs">●</span>
          <button type="button" onClick={() => setOpen(true)} className="truncate text-left text-ivory flex-1 min-w-0">
            {voterLabel(selected)}
            {selected.telegram_username && <span className="text-muted text-xs"> @{selected.telegram_username}</span>}
          </button>
          <button type="button" onClick={() => onPick(null)} className="text-muted hover:text-red-300 text-xs shrink-0" title="Відв'язати">
            ✕
          </button>
        </div>
      ) : (
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Знайти акаунт за іменем чи @ніком…"
          className="w-full bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none focus:ring-1 focus:ring-gold/40"
        />
      )}

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-panel shadow-xl max-h-72 overflow-auto">
          {best && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gold-bright">Найкращий збіг</div>
              {row(best.voter, best.score, true)}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted">
                {best ? "Інші схожі" : q.trim() ? "Результати" : "Схожі на ім'я номінанта"}
              </div>
              {rest.map((r) => row(r.voter, r.score))}
            </>
          )}
          {ranked.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted">
              {q.trim()
                ? "Нікого не знайдено. Можливо, ця людина ще не заходила на сайт."
                : "Схожих акаунтів немає — людина ще не заходила на сайт. Почни вводити ім'я для пошуку."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
