"use client";

type Staff = { id: string; name: string; photo_url?: string | null };

// Вибір судді (або тренера): список + імʼя нового + URL фото.
// Поле URL стоїть праворуч від списку на тій самій висоті, прев'ю — знизу.
export default function StaffPicker({
  label,
  newLabel,
  staff,
  selectedId,
  onSelectId,
  newName,
  onNewName,
  photoUrl,
  onPhotoUrl,
}: {
  label: string;
  newLabel: string;
  staff: Staff[];
  selectedId: string; // "" (не призначено), "__new__" (новий) або id
  onSelectId: (id: string) => void;
  newName: string;
  onNewName: (name: string) => void;
  photoUrl?: string;
  onPhotoUrl?: (url: string) => void;
}) {
  const current = staff.find((s) => s.id === selectedId);
  const shown = photoUrl !== undefined ? photoUrl : current?.photo_url ?? "";
  const showPhoto = !!onPhotoUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className={showPhoto ? "grid grid-cols-[1fr_1.1fr] gap-2" : ""}>
        <select
          value={selectedId}
          onChange={(e) => onSelectId(e.target.value)}
          className="w-full bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none focus:ring-1 focus:ring-gold/40"
        >
          <option value="">— {label}: не призначено —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="__new__">➕ {newLabel}…</option>
        </select>
        {showPhoto && (
          <input
            value={shown}
            onChange={(e) => onPhotoUrl?.(e.target.value)}
            placeholder="URL фото"
            className="w-full bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none focus:ring-1 focus:ring-gold/40"
          />
        )}
      </div>
      {selectedId === "__new__" && (
        <input
          value={newName}
          onChange={(e) => onNewName(e.target.value)}
          placeholder={`Ім'я — ${label.toLowerCase()}`}
          autoFocus
          className="w-full bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
      )}
      {showPhoto && shown && (
        <img
          src={shown}
          alt={label}
          className="h-16 w-16 rounded-full object-cover border border-white/10 bg-panel-raised"
        />
      )}
    </div>
  );
}
