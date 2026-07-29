"use client";

import { useState } from "react";

type Player = {
  id: string;
  full_name: string;
  short_name: string | null;
  jersey_number: number | null;
  photo_url: string | null;
  positions?: string[] | null;
  photo_focus_x?: number | null;
  photo_focus_y?: number | null;
};

type Edit = {
  photoUrl: string;
  shortName: string;
  positions: string;
  focusX: number;
  focusY: number;
};

export default function RosterManager({ roster }: { roster: Player[] }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function getVal(p: Player): Edit {
    return (
      edits[p.id] ?? {
        photoUrl: p.photo_url ?? "",
        shortName: p.short_name ?? "",
        positions: (p.positions ?? []).join(", "),
        focusX: p.photo_focus_x ?? 50,
        focusY: p.photo_focus_y ?? 50,
      }
    );
  }

  async function save(p: Player) {
    const val = getVal(p);
    setSavingId(p.id);
    setSavedId(null);
    await fetch(`/api/admin/players/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoUrl: val.photoUrl || null,
        shortName: val.shortName || null,
        positions: val.positions
          ? val.positions.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        photoFocusX: val.focusX,
        photoFocusY: val.focusY,
      }),
    });
    setSavingId(null);
    setSavedId(p.id);
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel max-h-[32rem] overflow-y-auto">
      <div className="flex flex-col divide-y divide-white/5">
        {roster.map((p) => {
          const val = getVal(p);
          return (
            <div key={p.id} className="px-4 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-muted">{p.jersey_number ?? "—"}</span>
                <span className="w-36 truncate text-ivory">{p.full_name}</span>
                {val.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={val.photoUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover shrink-0"
                    style={{ objectPosition: `${val.focusX}% ${val.focusY}%` }}
                  />
                )}
                <input
                  placeholder="URL фото (PNG)"
                  value={val.photoUrl}
                  onChange={(e) => setEdits((cur) => ({ ...cur, [p.id]: { ...val, photoUrl: e.target.value } }))}
                  className="flex-1 min-w-[140px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
                />
                <input
                  placeholder="прізвище (авто)"
                  value={val.shortName}
                  onChange={(e) => setEdits((cur) => ({ ...cur, [p.id]: { ...val, shortName: e.target.value } }))}
                  className="w-32 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
                />
                <input
                  placeholder="позиції: ЦЗ, ЦОП"
                  value={val.positions}
                  onChange={(e) => setEdits((cur) => ({ ...cur, [p.id]: { ...val, positions: e.target.value } }))}
                  className="w-36 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
                />
                <button
                  onClick={() => save(p)}
                  disabled={savingId === p.id}
                  className="rounded bg-panel-raised border border-gold/30 text-gold-bright px-2 py-1.5 disabled:opacity-40"
                >
                  {savingId === p.id ? "…" : savedId === p.id ? "✓" : "Зберегти"}
                </button>
              </div>
              {val.photoUrl && (
                <div className="flex items-center gap-2 mt-1.5 pl-8 text-[10px] text-muted">
                  кадрування:
                  <span>X</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val.focusX}
                    onChange={(e) => setEdits((cur) => ({ ...cur, [p.id]: { ...val, focusX: Number(e.target.value) } }))}
                  />
                  <span>Y</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val.focusY}
                    onChange={(e) => setEdits((cur) => ({ ...cur, [p.id]: { ...val, focusY: Number(e.target.value) } }))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
