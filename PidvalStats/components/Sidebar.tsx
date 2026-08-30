"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Головна", hint: "Камп Ноу" },
  { href: "/matches", label: "Матчі", hint: "Календар" },
  { href: "/season", label: "Сезон", hint: "Таблиця" },
  { href: "/voters", label: "Фанати", hint: "Хто як голосує" },
  { href: "/manager", label: "Менеджер", hint: "В розробці" },
  { href: "/social", label: "Соц Мережа", hint: "В розробці" },
  { href: "/credits", label: "Контакт", hint: "Хто робить сайт" },
];

export default function Sidebar({
  teamName,
  crestUrl,
}: {
  teamName?: string | null;
  crestUrl?: string | null;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.voter?.isAdmin))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-[220px] shrink-0 border-r border-white/5 bg-panel/40 backdrop-blur-sm px-6 py-6 hidden md:flex md:flex-col md:justify-between sticky top-0 h-dvh overflow-y-auto">
      <div>
        <div className="mb-6 flex items-center gap-2.5 px-1">
          {crestUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={crestUrl} alt="" className="h-8 w-8 object-contain shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-panel-raised shrink-0" aria-hidden />
          )}
          <span className="font-display text-lg text-ivory truncate">{teamName ?? "Барселона"}</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative rounded-md px-3 py-2 transition-colors duration-200 ${
                  active ? "bg-panel-raised" : "hover:bg-white/5"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gold" />
                )}
                <div
                  className={`font-display text-base ${
                    active ? "text-gold-bright" : "text-ivory/85 group-hover:text-ivory"
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-[11px] text-muted">{item.hint}</div>
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
                className={`group relative block rounded-md px-3 py-2 transition-colors duration-200 ${
                  pathname === "/admin" ? "bg-panel-raised" : "hover:bg-white/5"
                }`}
              >
                <div className="font-display text-base text-red-400 group-hover:text-red-300">Адмінка</div>
                <div className="text-[11px] text-muted">Керування</div>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Резервуємо місце під плаваючу аватарку (AccountPanel, fixed
          bottom-4 left-4) — інакше на високих списках навігація підповзає
          під неї. */}
      <div className="h-14" />
    </aside>
  );
}
