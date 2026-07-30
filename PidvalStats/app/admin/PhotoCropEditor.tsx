"use client";

import { useRef, useState } from "react";

export default function PhotoCropEditor({
  photoUrl,
  focusX,
  focusY,
  onChange,
}: {
  photoUrl: string;
  focusX: number;
  focusY: number;
  onChange: (x: number, y: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function updateFromPointer(clientX: number, clientY: number) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onChange(Math.round(x), Math.round(y));
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={boxRef}
        onMouseDown={(e) => {
          setDragging(true);
          updateFromPointer(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => dragging && updateFromPointer(e.clientX, e.clientY)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          setDragging(true);
          const t = e.touches[0];
          updateFromPointer(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          updateFromPointer(t.clientX, t.clientY);
        }}
        onTouchEnd={() => setDragging(false)}
        className="relative h-20 w-20 rounded-lg overflow-hidden border border-white/10 cursor-crosshair shrink-0 select-none"
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: `${focusX}% ${focusY}%`,
        }}
      >
        {/* Перехрестя показує обрану точку фокусу */}
        <div
          className="absolute h-2.5 w-2.5 rounded-full border-2 border-gold-bright bg-gold/40 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${focusX}%`, top: `${focusY}%` }}
        />
      </div>
      <span className="text-[10px] text-muted max-w-[90px] leading-snug">
        Тисни й тягни всередині — так обирається, яка частина фото буде в центрі круга.
      </span>
    </div>
  );
}
