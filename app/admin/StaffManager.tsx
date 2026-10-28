"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: string; name: string; photo_url: string | null };

function StaffRow({ table, person }: { table: "referees" | "coaches"; person: Staff }) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(person.photo_url ?? "");
  const [name, setName] = useState(person.name);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  async function save(patch: { photoUrl?: string; name?: string }) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/staff/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, ...patch }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setPhotoUrl(data.url);
      await save({ photoUrl: data.url });
    }
  }

  async function remove() {
    if (!confirm(`Видалити ${person.name} зі списку персоналу?`)) return;
    setRemoving(true);
    setRemoveError("");
    const res = await fetch(`/api/admin/staff/${person.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table }),
    });
    const data = await res.json();
    setRemoving(false);
    if (!res.ok) {
      setRemoveError(data.error ?? "Не вдалось видалити");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-ivory/40">{person.name[0]}</span>
          )}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() !== person.name && save({ name })}
          className="w-32 shrink-0 bg-panel-raised rounded px-2 py-1.5 text-ivory outline-none"
        />
        <label className="text-[10px] text-muted rounded bg-panel-raised px-2 py-1.5 cursor-pointer hover:text-ivory transition-colors duration-150 shrink-0">
          {uploading ? "Завантажуємо…" : "Завантажити фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
        </label>
        <input
          placeholder="або встав URL фото"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          onBlur={() => save({ photoUrl })}
          className="flex-1 min-w-[120px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none text-[10px]"
        />
        {saving && <span className="text-muted shrink-0">…</span>}
        {!saving && saved && <span className="text-gold-bright shrink-0">✓</span>}
        <button
          onClick={remove}
          disabled={removing}
          className="text-red-400 hover:text-red-300 shrink-0 px-2 py-1 rounded hover:bg-white/5 transition-colors duration-150"
        >
          {removing ? "…" : "Видалити"}
        </button>
      </div>
      {removeError && <div className="text-red-400 text-[10px] pl-16">{removeError}</div>}
    </div>
  );
}

export default function StaffManager({ referees, coaches }: { referees: Staff[]; coaches: Staff[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="eyebrow mb-2 px-1">Тренери</div>
        <div className="rounded-xl border border-white/5 bg-panel divide-y divide-white/5">
          {coaches.length === 0 && <p className="text-xs text-muted px-4 py-4">Ще немає жодного тренера в базі.</p>}
          {coaches.map((c) => (
            <StaffRow key={c.id} table="coaches" person={c} />
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow mb-2 px-1">Судді</div>
        <div className="rounded-xl border border-white/5 bg-panel divide-y divide-white/5">
          {referees.length === 0 && <p className="text-xs text-muted px-4 py-4">Ще немає жодного судді в базі.</p>}
          {referees.map((r) => (
            <StaffRow key={r.id} table="referees" person={r} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted px-1">
        Тренер і суддя зʼявляються тут автоматично після того, як їхнє імʼя вписали при створенні чи редагуванні матчу.
      </p>
    </div>
  );
}
