"use client";

import { useState } from "react";

type Player = {
  id: string;
  full_name: string;
  short_name: string | null;
  jersey_number: number | null;
  photo_url: string | null;
};

export default function RosterManager({ roster }: { roster: Player[] }) {
  const [edits, setEdits] = useState<Record<string, { photoUrl: string; shortName: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function getVal(p: Player) {
    return edits[p.id] ?? { photoUrl: p.photo_url ?? "", shortName: p.short_name ?? "" };
  }

  async function save(p: Player) {
    const val = getVal(p);
    setSavingId(p.id);
    setSavedId(null);
    const res = await fetch(`/api/admin/players/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: val.photoUrl || null, shortName: val.shortName || null }),
    });
    setSavingId(null);
    if (res.ok) setSavedId(p.id);
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel max-h-[28rem] overflow-y-auto">
      <div className="flex flex-col divide-y divide-white/5">
        {roster.map((p) => {
          const val = getVal(p);
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs">
              <span className="w-6 text-muted">{p.jersey_number ?? "—"}</span>
              <span className="w-36 truncate text-ivory">{p.full_name}</span>
              <input
                placeholder="URL фото (PNG)"
                value={val.photoUrl}
                onChange={(e) =>
                  setEdits((cur) => ({ ...cur, [p.id]: { ...val, photoUrl: e.target.value } }))
                }
                className="flex-1 min-w-[160px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
              />
              <input
                placeholder="прізвище (авто, якщо пусто)"
                value={val.shortName}
                onChange={(e) =>
                  setEdits((cur) => ({ ...cur, [p.id]: { ...val, shortName: e.target.value } }))
                }
                className="w-40 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
              />
              <button
                onClick={() => save(p)}
                disabled={savingId === p.id}
                className="rounded bg-panel-raised border border-gold/30 text-gold-bright px-2 py-1.5 disabled:opacity-40"
              >
                {savingId === p.id ? "…" : savedId === p.id ? "✓" : "Зберегти"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
