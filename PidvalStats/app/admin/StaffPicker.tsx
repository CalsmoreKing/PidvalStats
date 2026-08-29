"use client";

type Staff = { id: string; name: string };

export default function StaffPicker({
  label,
  newLabel,
  staff,
  selectedId,
  onSelectId,
  newName,
  onNewName,
}: {
  label: string;
  newLabel: string;
  staff: Staff[];
  selectedId: string; // "" (не призначено), "__new__" (новий) або id
  onSelectId: (id: string) => void;
  newName: string;
  onNewName: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectedId}
        onChange={(e) => onSelectId(e.target.value)}
        className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
      >
        <option value="">— {label}: не призначено —</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="__new__">➕ {newLabel}…</option>
      </select>
      {selectedId === "__new__" && (
        <input
          value={newName}
          onChange={(e) => onNewName(e.target.value)}
          placeholder={`Ім'я — ${label.toLowerCase()}`}
          autoFocus
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
      )}
    </div>
  );
}
