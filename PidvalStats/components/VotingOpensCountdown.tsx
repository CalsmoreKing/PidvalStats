"use client";

import { useEffect, useState } from "react";

// Той самий принцип, що й VotingCountdown: рахуємо різницю в часі лише
// ПІСЛЯ монтування на клієнті, а не в тілі рендеру — інакше сервер (UTC) і
// браузер глядача порахують по-різному й React зловить hydration mismatch.
export default function VotingOpensCountdown({ opensAt }: { opensAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, new Date(opensAt).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [opensAt]);

  if (remaining === null || remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  return (
    <div className="rounded-xl border border-white/5 bg-panel px-4 py-3 text-center">
      <div className="eyebrow mb-1">Голосування відкриється через</div>
      <div className="font-utility text-2xl text-gold-bright">
        {hours > 0 && `${hours}:`}
        {min.toString().padStart(2, "0")}:{sec.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
