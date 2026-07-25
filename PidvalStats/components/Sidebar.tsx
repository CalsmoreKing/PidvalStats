"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TelegramLoginButton from "@/components/TelegramLoginButton";

const items = [
  { href: "/", label: "Камп Ноу", hint: "Головна" },
  { href: "/matches", label: "Матчі", hint: "Календар" },
  { href: "/season", label: "Сезон", hint: "Таблиця" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-white/5 bg-panel/40 backdrop-blur-sm px-6 py-8 hidden md:flex md:flex-col md:justify-between">
      <div>
        <div className="mb-12">
          <div className="eyebrow">Сезон 26/27</div>
          <div className="font-display text-2xl font-semibold text-ivory mt-1">
            Барселона
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative rounded-md px-3 py-3 transition-colors ${
                  active ? "bg-panel-raised" : "hover:bg-white/5"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gold" />
                )}
                <div
                  className={`font-display text-lg ${
                    active ? "text-gold-bright" : "text-ivory/85 group-hover:text-ivory"
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-xs text-muted">{item.hint}</div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hairline mb-4" />
      <TelegramLoginButton />
      <p className="text-[11px] text-muted leading-relaxed mt-3">
        Оцінюй гравців після кожного матчу.
        Один голос на матч через Telegram.
      </p>
    </aside>
  );
}
