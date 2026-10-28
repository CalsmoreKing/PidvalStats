"use client";

import { createContext, useContext } from "react";
import { BallIcon, BootIcon } from "@/components/icons";

// Іконки голу, пенальті, асисту й карток. Якщо дизайнер завантажив свою
// (адмінка → «Іконки») — показуємо її ВСЮДИ, де є StatIcon; якщо ні —
// лишається вбудована запасна. Мапу { ключ: url } один раз читає layout.
export type IconKey = "goal" | "penalty_goal" | "assist" | "yellow_card" | "red_card";

export const ICON_KEYS: { key: IconKey; label: string; hint: string }[] = [
  { key: "goal", label: "Гол", hint: "М'яч" },
  { key: "penalty_goal", label: "Гол з пенальті", hint: "М'яч з позначкою «П» або крапкою пенальті" },
  { key: "assist", label: "Асист", hint: "Бутса або передача" },
  { key: "yellow_card", label: "Жовта картка", hint: "Вертикальна картка" },
  { key: "red_card", label: "Червона картка", hint: "Вертикальна картка" },
];

const IconsContext = createContext<Record<string, string>>({});

export function IconsProvider({
  icons,
  children,
}: {
  icons: Record<string, string>;
  children: React.ReactNode;
}) {
  return <IconsContext.Provider value={icons}>{children}</IconsContext.Provider>;
}

export default function StatIcon({ kind, className = "h-3 w-3" }: { kind: IconKey; className?: string }) {
  const icons = useContext(IconsContext);
  const url = icons[kind];

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${className} object-contain inline-block`} />;
  }

  switch (kind) {
    case "goal":
      return <BallIcon className={className} />;
    case "penalty_goal":
      return (
        <span className="relative inline-flex">
          <BallIcon className={className} />
          <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-gold text-void text-[6px] font-bold flex items-center justify-center leading-none">
            П
          </span>
        </span>
      );
    case "assist":
      return <BootIcon className={className} />;
    case "yellow_card":
      return <span className={`${className} inline-flex items-center justify-center`}><span className="h-[85%] w-[62%] bg-yellow-400 rounded-[1px]" /></span>;
    case "red_card":
      return <span className={`${className} inline-flex items-center justify-center`}><span className="h-[85%] w-[62%] bg-red-500 rounded-[1px]" /></span>;
  }
}
