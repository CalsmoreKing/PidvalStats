"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TelegramLoginButton from "@/components/TelegramLoginButton";

const items = [
  { href: "/", label: "Камп Ноу" },
  { href: "/matches", label: "Матчі" },
  { href: "/season", label: "Сезон" },
];

export function MobileTopBar() {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-panel/60 backdrop-blur-sm sticky top-0 z-20">
      <span className="font-display text-lg text-ivory">Барселона</span>
      <TelegramLoginButton />
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex bg-panel/90 backdrop-blur-sm border-t border-white/5">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center py-3 text-xs font-utility uppercase tracking-wide ${
              active ? "text-gold-bright" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
