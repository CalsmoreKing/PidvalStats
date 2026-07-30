"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Головна", hint: "Камп Ноу" },
  { href: "/matches", label: "Матчі", hint: "Календар" },
  { href: "/season", label: "Сезон", hint: "Таблиця" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.voter?.isAdmin))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-[220px] shrink-0 border-r border-white/5 bg-panel/40 backdrop-blur-sm px-6 py-8 hidden md:flex md:flex-col md:justify-between">
      <div>
        {/* TODO: сюди піде логотип клубу, коли буде готовий файл */}
        <div className="mb-12 h-10" />

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative rounded-md px-3 py-3 transition-colors duration-200 ${
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

          <div
            className={`grid transition-all duration-300 ease-out ${
              isAdmin ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <Link
                href="/admin"
                className={`group relative block rounded-md px-3 py-3 transition-colors duration-200 ${
                  pathname === "/admin" ? "bg-panel-raised" : "hover:bg-white/5"
                }`}
              >
                <div className="font-display text-lg text-red-400 group-hover:text-red-300">Адмінка</div>
                <div className="text-xs text-muted">Керування</div>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <div />
    </aside>
  );
}
