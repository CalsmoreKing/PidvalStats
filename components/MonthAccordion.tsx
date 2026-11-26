"use client";

import { useState } from "react";

// Згортвана група матчів із плавною анімацією розгортання (grid-rows 0fr → 1fr
// дає справжній перехід висоти, на відміну від <details>, який стрибає).
export default function MonthAccordion({
  label,
  countLabel,
  defaultOpen = false,
  children,
}: {
  label: string;
  countLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/5 bg-panel/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left select-none"
      >
        <span className="font-display text-base text-gold-bright/90">{label}</span>
        <span className="flex items-center gap-2 text-[11px] text-muted">
          {countLabel}
          <span
            className="inline-block transition-transform duration-500 ease-out"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-3 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
