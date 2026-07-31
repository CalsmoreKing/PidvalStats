"use client";

// Максимально просто: 3 кнопки замість перетягування. Прев'ю одразу
// показує, як фото ляже в кружечок.
const PRESETS: { label: string; y: number }[] = [
  { label: "Верх (обличчя)", y: 20 },
  { label: "Центр", y: 50 },
  { label: "Низ", y: 80 },
];

export default function PhotoCropEditor({
  photoUrl,
  focusY,
  onChange,
}: {
  photoUrl: string;
  focusY: number;
  onChange: (y: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-16 w-16 rounded-full overflow-hidden border border-white/10 shrink-0"
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: `50% ${focusY}%`,
        }}
      />
      <div className="flex gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.y)}
            className={`text-[10px] rounded-full px-2.5 py-1.5 border transition-colors duration-150 ${
              focusY === preset.y
                ? "bg-gold/30 border-gold/50 text-gold-bright"
                : "border-white/10 text-muted hover:text-ivory"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
