"use client";

const STEP = 5;

export default function PhotoCropEditor({
  photoUrl,
  focusX,
  focusY,
  zoom,
  onChange,
}: {
  photoUrl: string;
  focusX: number;
  focusY: number;
  zoom: number;
  onChange: (patch: { focusX?: number; focusY?: number; zoom?: number }) => void;
}) {
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

  return (
    <div className="flex items-center gap-3">
      {/* Живе прев'ю — точно так, як буде на сайті */}
      <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gold/60 relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom / 100})` }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Стрілки — рух фото */}
        <div className="grid grid-cols-3 gap-1 w-24">
          <div />
          <ArrowBtn label="↑" onClick={() => onChange({ focusY: clamp(focusY - STEP) })} />
          <div />
          <ArrowBtn label="←" onClick={() => onChange({ focusX: clamp(focusX - STEP) })} />
          <ArrowBtn label="●" onClick={() => onChange({ focusX: 50, focusY: 50, zoom: 100 })} title="Скинути" />
          <ArrowBtn label="→" onClick={() => onChange({ focusX: clamp(focusX + STEP) })} />
          <div />
          <ArrowBtn label="↓" onClick={() => onChange({ focusY: clamp(focusY + STEP) })} />
          <div />
        </div>
        {/* Зум */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          зум
          <button
            type="button"
            onClick={() => onChange({ zoom: clamp(zoom - 10, 100, 250) })}
            className="h-5 w-5 rounded bg-panel-raised hover:text-gold-bright"
          >
            −
          </button>
          <span className="w-8 text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => onChange({ zoom: clamp(zoom + 10, 100, 250) })}
            className="h-5 w-5 rounded bg-panel-raised hover:text-gold-bright"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowBtn({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-6 w-6 rounded bg-panel-raised text-ivory/70 hover:text-gold-bright hover:bg-panel transition-colors duration-150 flex items-center justify-center text-xs"
    >
      {label}
    </button>
  );
}
