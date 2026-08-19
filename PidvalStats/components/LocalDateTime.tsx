"use client";

import { useEffect, useState } from "react";

// ВАЖЛИВО: не форматуємо дату прямо під час рендеру. Сервер рендерить у
// своєму поясі (UTC на Vercel), а браузер глядача — у своєму, тому текст
// різниться між SSR і першим клієнтським рендером -> React ловить hydration
// mismatch (помилки #425/#418/#423, які ламають інтерактивність сторінки).
// Рішення: перший рендер — завжди порожній (однаково і на сервері, і в
// браузері), а сам текст підставляємо вже ПІСЛЯ монтування, у useEffect.
export default function LocalDateTime({
  iso,
  mode = "datetime",
}: {
  iso: string;
  mode?: "date" | "time" | "datetime";
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(iso);
    const datePart = () => d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
    const timePart = () => d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    if (mode === "date") setText(datePart());
    else if (mode === "time") setText(timePart());
    else setText(`${datePart()} ${timePart()}`);
  }, [iso, mode]);

  if (text === null) return null;
  return <>{text}</>;
}
