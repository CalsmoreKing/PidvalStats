"use client";

import { useState } from "react";
import PhotoCropEditor from "./PhotoCropEditor";

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
  fullName: string;
  jerseyNumber: string;
};

export default function RosterManager({ roster }: { roster: Player[] }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);

  function getVal(p: Player): Edit {
    return (
      edits[p.id] ?? {
        photoUrl: p.photo_url ?? "",
        shortName: p.short_name ?? "",
        positions: (p.positions ?? []).join(", "),
        focusX: p.photo_focus_x ?? 50,
        focusY: p.photo_focus_y ?? 50,
        fullName: p.full_name,
        jerseyNumber: p.jersey_number != null ? String(p.jersey_number) : "",
      }
    );
  }

  function patch(id: string, val: Edit, next: Partial<Edit>) {
    setEdits((cur) => ({ ...cur, [id]: { ...val, ...next } }));
  }

  async function save(p: Player, overrides?: Partial<Edit>) {
    const val = { ...getVal(p), ...overrides };
    setSavingId(p.id);
    setSavedId(null);
    await fetch(`/api/admin/players/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoUrl: val.photoUrl || null,
        shortName: val.shortName || null,
        positions: val.positions ? val.positions.split(",").map((s) => s.trim()).filter(Boolean) : null,
        photoFocusX: val.focusX,
        photoFocusY: val.focusY,
        fullName: val.fullName,
        jerseyNumber: val.jerseyNumber === "" ? null : Number(val.jerseyNumber),
      }),
    });
    setSavingId(null);
    setSavedId(p.id);
  }

  async function uploadFile(p: Player, file: File) {
    setUploadingId(p.id);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploadingId(null);
    if (res.ok) {
      const val = getVal(p);
      patch(p.id, val, { photoUrl: data.url });
      await save(p, { photoUrl: data.url });
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel max-h-[36rem] overflow-y-auto">
      <div className="flex flex-col divide-y divide-white/5">
        {roster.map((p) => {
          const val = getVal(p);
          return (
            <div key={p.id} className="px-4 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {editingNumberId === p.id ? (
                  <input
                    autoFocus
                    type="number"
                    value={val.jerseyNumber}
                    onChange={(e) => patch(p.id, val, { jerseyNumber: e.target.value })}
                    onBlur={() => {
                      setEditingNumberId(null);
                      save(p);
                    }}
                    className="w-10 bg-panel-raised rounded px-1 py-1 text-ivory"
                  />
                ) : (
                  <button
                    onClick={() => setEditingNumberId(p.id)}
                    className="w-6 text-muted hover:text-gold-bright transition-colors duration-150"
                    title="Змінити номер"
                  >
                    {p.jersey_number ?? "—"}
                  </button>
                )}

                {editingNameId === p.id ? (
                  <input
                    autoFocus
                    value={val.fullName}
                    onChange={(e) => patch(p.id, val, { fullName: e.target.value })}
                    onBlur={() => {
                      setEditingNameId(null);
                      save(p);
                    }}
                    className="w-40 bg-panel-raised rounded px-1.5 py-1 text-ivory"
                  />
                ) : (
                  <button
                    onClick={() => setEditingNameId(p.id)}
                    className="w-40 truncate text-left text-ivory hover:text-gold-bright transition-colors duration-150"
                    title="Змінити ім'я"
                  >
                    {p.full_name}
                  </button>
                )}

                <input
                  placeholder="прізвище (авто)"
                  value={val.shortName}
                  onChange={(e) => patch(p.id, val, { shortName: e.target.value })}
                  className="w-28 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
                />
                <input
                  placeholder="позиції: ЦЗ, ЦОП"
                  value={val.positions}
                  onChange={(e) => patch(p.id, val, { positions: e.target.value })}
                  className="w-32 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
                />
                <button
                  onClick={() => save(p)}
                  disabled={savingId === p.id}
                  className="rounded bg-panel-raised border border-gold/30 text-gold-bright px-2 py-1.5 disabled:opacity-40 transition-colors duration-150"
                >
                  {savingId === p.id ? "…" : savedId === p.id ? "✓" : "Зберегти"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 pl-8">
                <label className="text-[10px] text-muted rounded bg-panel-raised px-2 py-1.5 cursor-pointer hover:text-ivory transition-colors duration-150">
                  {uploadingId === p.id ? "Завантажуємо…" : "Завантажити фото"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadFile(p, e.target.files[0])}
                  />
                </label>
                <input
                  placeholder="або встав URL фото"
                  value={val.photoUrl}
                  onChange={(e) => patch(p.id, val, { photoUrl: e.target.value })}
                  onBlur={() => save(p)}
                  className="flex-1 min-w-[140px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none text-[10px]"
                />
              </div>

              {val.photoUrl && (
                <div className="mt-2 pl-8">
                  <PhotoCropEditor
                    photoUrl={val.photoUrl}
                    focusY={val.focusY}
                    onChange={(y) => {
                      patch(p.id, val, { focusY: y });
                      save(p, { focusY: y });
                    }}
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
