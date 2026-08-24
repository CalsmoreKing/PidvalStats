"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PhotoCropEditor from "./PhotoCropEditor";
import { GripIcon } from "@/components/icons";
import { POSITIONS, type Position } from "@/lib/positions";
import { NATIONALITY_TO_ISO } from "@/lib/flags";

type Team = { id: string; slug: string; name: string };

type Player = {
  id: string;
  full_name: string;
  short_name: string | null;
  jersey_number: number | null;
  position: string;
  positions?: string[] | null;
  photo_url: string | null;
  photo_focus_x?: number | null;
  photo_focus_y?: number | null;
  photo_zoom?: number | null;
  is_active: boolean;
  team_id: string;
  // Supabase без generated-типів завжди показує вкладену relation як масив
  // на рівні TypeScript (навіть коли в базі це one-to-one через team_id) —
  // той самий принцип, що й `competitions: {...}[]` у MatchAdminRow.tsx.
  teams?: { slug: string; name: string }[] | null;
};

type Edit = {
  photoUrl: string;
  shortName: string;
  positions: string;
  focusX: number;
  focusY: number;
  zoom: number;
  fullName: string;
  jerseyNumber: string;
};

function getVal(p: Player, edits: Record<string, Edit>): Edit {
  return (
    edits[p.id] ?? {
      photoUrl: p.photo_url ?? "",
      shortName: p.short_name ?? "",
      positions: (p.positions ?? []).join(", "),
      focusX: p.photo_focus_x ?? 50,
      focusY: p.photo_focus_y ?? 50,
      zoom: p.photo_zoom ?? 100,
      fullName: p.full_name,
      jerseyNumber: p.jersey_number != null ? String(p.jersey_number) : "",
    }
  );
}

export default function RosterManager({ roster, teams }: { roster: Player[]; teams: Team[] }) {
  const router = useRouter();
  // Локальна копія — переміщення між командами/архівом застосовується сюди
  // МИТТЄВО (оптимістично), а не чекає відповіді сервера й router.refresh().
  // Раніше через цю затримку сортування "стрибало" вже ПІСЛЯ дропу, що
  // виглядало як лаг. Коли сервер підтвердить і роутер оновить `roster`,
  // ефект нижче тихо синхронізує локальну копію (без видимої зміни, бо
  // значення вже й так збігаються).
  const [localRoster, setLocalRoster] = useState(roster);
  useEffect(() => {
    setLocalRoster(roster);
  }, [roster]);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function patch(id: string, val: Edit, next: Partial<Edit>) {
    setEdits((cur) => ({ ...cur, [id]: { ...val, ...next } }));
  }

  async function save(p: Player, overrides?: Partial<Edit>) {
    const val = { ...getVal(p, edits), ...overrides };
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
        photoZoom: val.zoom,
        fullName: val.fullName,
        jerseyNumber: val.jerseyNumber === "" ? null : Number(val.jerseyNumber),
      }),
    });
    setSavingId(null);
    setSavedId(p.id);
    router.refresh();
  }

  async function uploadFile(p: Player, file: File) {
    setUploadingId(p.id);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploadingId(null);
    if (res.ok) {
      const val = getVal(p, edits);
      patch(p.id, val, { photoUrl: data.url });
      await save(p, { photoUrl: data.url });
    }
  }

  async function moveTo(p: Player, target: { teamId?: string; archive?: boolean }) {
    setMenuOpenId(null);
    const body: Record<string, unknown> = {};
    if (target.teamId) {
      body.teamId = target.teamId;
      body.isActive = true;
    }
    if (target.archive) {
      body.isActive = false;
    }
    // Оптимістично — переносимо гравця в потрібну колонку МИТТЄВО, не чекаючи
    // мережі. PATCH іде у фоні; коли router.refresh() підтягне свіжі дані,
    // ефект вище тихо синхронізує (значення вже збігаються, змін не видно).
    setLocalRoster((cur) =>
      cur.map((r) =>
        r.id === p.id
          ? { ...r, team_id: target.teamId ?? r.team_id, is_active: target.archive ? false : true }
          : r
      )
    );
    await fetch(`/api/admin/players/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id); // потрібно Firefox, щоб drag взагалі почався
  }
  function handleDragEnd() {
    setDraggedId(null);
    setOverZone(null);
  }
  function zoneDragOver(zone: string) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overZone !== zone) setOverZone(zone);
    };
  }
  function zoneDragLeave(zone: string) {
    return () => {
      setOverZone((cur) => (cur === zone ? null : cur));
    };
  }
  function zoneDrop(target: { teamId?: string; archive?: boolean }) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      setOverZone(null);
      const id = draggedId;
      setDraggedId(null);
      if (!id) return;
      const player = localRoster.find((r) => r.id === id);
      if (!player) return;
      moveTo(player, target);
    };
  }

  const activePlayers = localRoster.filter((p) => p.is_active);
  const archivedPlayers = localRoster.filter((p) => !p.is_active);
  const byTeam = (teamId: string) => activePlayers.filter((p) => p.team_id === teamId);

  const rowProps = {
    savingId,
    savedId,
    uploadingId,
    editingNameId,
    editingNumberId,
    menuOpenId,
    draggedId,
    teams,
    onPatch: patch,
    onSave: save,
    onUploadFile: uploadFile,
    setEditingNameId,
    setEditingNumberId,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onToggleMenu: (id: string | null) => setMenuOpenId((cur) => (cur === id ? null : id)),
    onMove: (p: Player, teamId: string) => moveTo(p, { teamId }),
    onArchive: (p: Player) => moveTo(p, { archive: true }),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-muted max-w-sm">
          Тримай за <GripIcon className="inline h-3 w-3 -mt-0.5" /> і перетягни гравця в іншу команду або в архів.
          На вузькому екрані — кнопка «⋯» біля гравця робить те саме.
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs rounded-lg border border-gold/30 text-gold-bright px-3 py-1.5 hover:bg-panel-raised transition-colors duration-150 shrink-0"
        >
          {showAdd ? "Скасувати" : "+ Додати гравця"}
        </button>
      </div>

      {showAdd && (
        <AddPlayerForm
          teams={teams}
          onDone={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((team) => (
          <DropZone
            key={team.id}
            title={team.name}
            count={byTeam(team.id).length}
            highlighted={overZone === team.id}
            onDragOver={zoneDragOver(team.id)}
            onDragLeave={zoneDragLeave(team.id)}
            onDrop={zoneDrop({ teamId: team.id })}
          >
            {byTeam(team.id).length === 0 && (
              <p className="text-xs text-muted px-4 py-4">Ще немає гравців у цій команді.</p>
            )}
            {byTeam(team.id).map((p) => (
              <PlayerRow key={p.id} player={p} val={getVal(p, edits)} {...rowProps} />
            ))}
          </DropZone>
        ))}
      </div>

      <DropZone
        title="Архів"
        subtitle="Гравці, що покинули команду — статистика лишається"
        count={archivedPlayers.length}
        highlighted={overZone === "archive"}
        onDragOver={zoneDragOver("archive")}
        onDragLeave={zoneDragLeave("archive")}
        onDrop={zoneDrop({ archive: true })}
      >
        {archivedPlayers.length === 0 && <p className="text-xs text-muted px-4 py-4">Архів порожній.</p>}
        {archivedPlayers.map((p) => (
          <PlayerRow key={p.id} player={p} val={getVal(p, edits)} {...rowProps} />
        ))}
      </DropZone>
    </div>
  );
}

function DropZone({
  title,
  subtitle,
  count,
  highlighted,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  highlighted: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-xl border bg-panel transition-colors duration-150 ${
        highlighted ? "border-gold bg-panel-raised/70" : "border-white/5"
      }`}
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="font-display text-base text-ivory">{title}</div>
          {subtitle && <div className="text-[10px] text-muted mt-0.5">{subtitle}</div>}
        </div>
        <span className="text-[10px] text-muted shrink-0 ml-2">{count}</span>
      </div>
      <div className="flex flex-col divide-y divide-white/5 max-h-[28rem] overflow-y-auto">{children}</div>
    </div>
  );
}

function PlayerRow({
  player: p,
  val,
  teams,
  savingId,
  savedId,
  uploadingId,
  editingNameId,
  editingNumberId,
  menuOpenId,
  draggedId,
  onPatch,
  onSave,
  onUploadFile,
  setEditingNameId,
  setEditingNumberId,
  onDragStart,
  onDragEnd,
  onToggleMenu,
  onMove,
  onArchive,
}: {
  player: Player;
  val: Edit;
  teams: Team[];
  savingId: string | null;
  savedId: string | null;
  uploadingId: string | null;
  editingNameId: string | null;
  editingNumberId: string | null;
  menuOpenId: string | null;
  draggedId: string | null;
  onPatch: (id: string, val: Edit, next: Partial<Edit>) => void;
  onSave: (p: Player, overrides?: Partial<Edit>) => void;
  onUploadFile: (p: Player, file: File) => void;
  setEditingNameId: (id: string | null) => void;
  setEditingNumberId: (id: string | null) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleMenu: (id: string | null) => void;
  onMove: (p: Player, teamId: string) => void;
  onArchive: (p: Player) => void;
}) {
  const isDragging = draggedId === p.id;
  const menuOpen = menuOpenId === p.id;

  return (
    <div className={`px-4 py-2.5 text-xs transition-opacity duration-150 ${!p.is_active ? "opacity-50 grayscale" : ""} ${isDragging ? "opacity-30" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          draggable
          onDragStart={(e) => onDragStart(e, p.id)}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-muted/50 hover:text-gold-bright shrink-0 touch-none"
          title="Перетягнути в іншу команду або архів"
        >
          <GripIcon />
        </span>

        {editingNumberId === p.id ? (
          <input
            autoFocus
            type="number"
            value={val.jerseyNumber}
            onChange={(e) => onPatch(p.id, val, { jerseyNumber: e.target.value })}
            onBlur={() => {
              setEditingNumberId(null);
              onSave(p);
            }}
            className="w-10 bg-panel-raised rounded px-1 py-1 text-ivory"
          />
        ) : (
          <button
            onClick={() => setEditingNumberId(p.id)}
            className="w-6 text-muted hover:text-gold-bright transition-colors duration-150"
            title="Змінити номер"
          >
            {val.jerseyNumber || "—"}
          </button>
        )}

        {editingNameId === p.id ? (
          <input
            autoFocus
            value={val.fullName}
            onChange={(e) => onPatch(p.id, val, { fullName: e.target.value })}
            onBlur={() => {
              setEditingNameId(null);
              onSave(p);
            }}
            className="w-40 bg-panel-raised rounded px-1.5 py-1 text-ivory"
          />
        ) : (
          <button
            onClick={() => setEditingNameId(p.id)}
            className="w-40 truncate text-left text-ivory hover:text-gold-bright transition-colors duration-150"
            title="Змінити ім'я"
          >
            {val.fullName}
          </button>
        )}

        <span className="eyebrow shrink-0" title="Основна позиція (задається при додаванні)">
          {p.position}
        </span>

        <input
          placeholder="нікнейм (авто)"
          value={val.shortName}
          onChange={(e) => onPatch(p.id, val, { shortName: e.target.value })}
          className="w-28 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
        />
        <input
          placeholder="позиції: ЦЗ, ЦОП"
          value={val.positions}
          onChange={(e) => onPatch(p.id, val, { positions: e.target.value })}
          className="w-32 bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
        />
        <button
          onClick={() => onSave(p)}
          disabled={savingId === p.id}
          className="rounded bg-panel-raised border border-gold/30 text-gold-bright px-2 py-1.5 disabled:opacity-40 transition-colors duration-150"
        >
          {savingId === p.id ? "…" : savedId === p.id ? "✓" : "Зберегти"}
        </button>

        <div className="relative ml-auto shrink-0">
          <button
            onClick={() => onToggleMenu(p.id)}
            className="text-muted hover:text-ivory px-2 py-1 rounded hover:bg-white/5 transition-colors duration-150"
            title="Дії з гравцем"
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg border border-gold/40 shadow-2xl py-1"
              style={{ backgroundColor: "#0F0A1C" }}
            >
              {p.is_active ? (
                <>
                  {teams
                    .filter((t) => t.id !== p.team_id)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onMove(p, t.id)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-ivory hover:bg-white/5"
                      >
                        → Перевести в «{t.name}»
                      </button>
                    ))}
                  <button
                    onClick={() => onArchive(p)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/5 border-t border-white/5"
                  >
                    Архівувати (покинув команду)
                  </button>
                </>
              ) : (
                teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onMove(p, t.id)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-gold-bright hover:bg-white/5"
                  >
                    Повернути в «{t.name}»
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {!p.is_active && p.teams?.[0]?.name && (
        <div className="pl-8 mt-1 text-[10px] text-muted">була в складі: {p.teams[0].name}</div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-2 pl-8">
        <label className="text-[10px] text-muted rounded bg-panel-raised px-2 py-1.5 cursor-pointer hover:text-ivory transition-colors duration-150">
          {uploadingId === p.id ? "Завантажуємо…" : "Завантажити фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUploadFile(p, e.target.files[0])}
          />
        </label>
        <input
          placeholder="або встав URL фото"
          value={val.photoUrl}
          onChange={(e) => onPatch(p.id, val, { photoUrl: e.target.value })}
          onBlur={() => onSave(p)}
          className="flex-1 min-w-[140px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none text-[10px]"
        />
      </div>

      {val.photoUrl && (
        <div className="mt-2 pl-8">
          <PhotoCropEditor
            photoUrl={val.photoUrl}
            focusX={val.focusX}
            focusY={val.focusY}
            zoom={val.zoom}
            onChange={(next) => {
              onPatch(p.id, val, next);
              onSave(p, next);
            }}
          />
        </div>
      )}
    </div>
  );
}

function AddPlayerForm({ teams, onDone }: { teams: Team[]; onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [position, setPosition] = useState<Position>(POSITIONS[0]);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [nationality, setNationality] = useState(Object.keys(NATIONALITY_TO_ISO)[0] ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [shortName, setShortName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !teamId || !position || !nationality || !birthDate) {
      setError("Заповни ім'я, команду, позицію, національність і дату народження");
      return;
    }
    setStatus("saving");
    setError("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        fullName,
        position,
        jerseyNumber: jerseyNumber === "" ? null : Number(jerseyNumber),
        nationality,
        birthDate,
        shortName: shortName || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Не вдалось додати гравця");
      return;
    }
    setStatus("idle");
    setFullName("");
    setJerseyNumber("");
    setShortName("");
    setBirthDate("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gold/20 bg-panel p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ім'я та прізвище"
          required
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position)}
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        >
          {POSITIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          placeholder="Номер (необов'язково)"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        >
          {Object.keys(NATIONALITY_TO_ISO).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        />
        <input
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Коротке ім'я (необов'язково)"
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <button
        type="submit"
        disabled={status === "saving"}
        className="self-start rounded-lg bg-gold text-void font-display px-5 py-2 text-sm disabled:opacity-40"
      >
        {status === "saving" ? "Додаємо…" : "Додати гравця"}
      </button>
    </form>
  );
}
