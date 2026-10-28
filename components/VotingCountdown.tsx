"use client";

import { useEffect, useState } from "react";

// Та сама проблема, що й у LocalDateTime: Date.now() на сервері й у браузері
// відрізняється (мілісекунди чи навіть секунди затримки мережі), тож текст
// таймера при першому рендері не збігається -> hydration mismatch. Рахуємо
// "скільки лишилось" лише після монтування на клієнті.
export default function VotingCountdown({ closesAt, className }: { closesAt: string; className?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, new Date(closesAt).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  if (remaining === null) return null;

  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  if (remaining <= 0) {
    return <span className={className ?? "text-muted"}>підраховуємо…</span>;
  }

  // Г:ХХ:СС — раніше було «хвилини:секунди», і за добу до кінця виходило
  // «1385:07». Години показуємо лише коли вони є.
  return (
    <span className={`font-utility ${className ?? "text-gold-bright"}`}>
      {hours > 0 && `${hours}:`}
      {min.toString().padStart(2, "0")}:{sec.toString().padStart(2, "0")}
    </span>
  );
}
