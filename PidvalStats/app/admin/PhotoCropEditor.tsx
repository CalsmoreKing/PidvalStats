"use client";

import { useRef, useState } from "react";

// Розмір великого кола в модалці кадрування (px)
const MODAL_SIZE = 300;

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
  onChange: (patch: { focusX?: number; focusY?: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftX, setDraftX] = useState(focusX);
  const [draftY, setDraftY] = useState(focusY);
  const naturalSize = useRef<{ w: number; h: number } | null>(null);
  const drag = useRef<{
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
  } | null>(null);

  function openModal() {
    setDraftX(focusX);
    setDraftY(focusY);
    naturalSize.current = null;
    setOpen(true);
  }

  // Скільки "зайвого" фото (px) виступає за межі кола по кожній осі при
  // поточному масштабі — саме в цих межах має сенс перетягування курсором.
  function overflow() {
    const n = naturalSize.current;
    if (!n) return { x: 0, y: 0 };
    const scale = Math.max(MODAL_SIZE / n.w, MODAL_SIZE / n.h) * (zoom / 100);
    return {
      x: Math.max(0, n.w * scale - MODAL_SIZE),
      y: Math.max(0, n.h * scale - MODAL_SIZE),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startFocusX: draftX, startFocusY: draftY };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const { x: overflowX, y: overflowY } = overflow();
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    // Перетягуємо ФОТО курсором (як стенсіль над зображенням) — рух вправо
    // відкриває лівішу частину фото, тому знак від'ємний.
    const nextX =
      overflowX > 0
        ? drag.current.startFocusX - (dx / overflowX) * 100
        : draftX;
    const nextY =
      overflowY > 0
        ? drag.current.startFocusY - (dy / overflowY) * 100
        : draftY;
    setDraftX(Math.max(0, Math.min(100, nextX)));
    setDraftY(Math.max(0, Math.min(100, nextY)));
  }

  function endDrag() {
    drag.current = null;
  }

  function save() {
    onChange({ focusX: Math.round(draftX), focusY: Math.round(draftY) });
    setOpen(false);
  }

  return (
    <>
      {/* Живе прев'ю — точно так, як буде на сайті. Клік відкриває редактор. */}
      <button
        type="button"
        onClick={openModal}
        className="group relative h-20 w-20 rounded-full overflow-hidden border-2 border-gold/60 shrink-0"
        title="Натисни, щоб змінити кадрування фото"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom / 100})` }}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-void/0 group-hover:bg-void/50 opacity-0 group-hover:opacity-100 transition-all duration-150 text-[10px] text-ivory">
          Кадрувати
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/80 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-2xl border border-gold/30 p-5 flex flex-col items-center gap-4"
            style={{ backgroundColor: "#17102A" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-lg text-ivory">Кадрування фото</div>

            <div
              className="relative rounded-full overflow-hidden border-2 border-gold cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ width: MODAL_SIZE, height: MODAL_SIZE }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                draggable={false}
                onLoad={(e) => {
                  naturalSize.current = {
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  };
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: `${draftX}% ${draftY}%`, transform: `scale(${zoom / 100})` }}
              />
            </div>

            <p className="text-[11px] text-muted text-center max-w-[220px]">
              Перетягни фото курсором, щоб виставити потрібну частину в коло
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 text-muted px-4 py-2 text-xs hover:text-ivory transition-colors duration-150"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-gold text-void px-4 py-2 text-xs font-medium"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
