"use client";

import { useState, ReactNode } from "react";

export default function AdminTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap sticky top-0 md:top-4 z-10 backdrop-blur-sm py-2 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
              active === t.key
                ? "bg-panel-raised border-gold/40 text-gold-bright"
                : "border-white/10 text-muted hover:border-white/25"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          className={`transition-opacity duration-200 ${active === t.key ? "block opacity-100" : "hidden opacity-0"}`}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
