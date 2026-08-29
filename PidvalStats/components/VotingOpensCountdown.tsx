"use client";

import { useEffect, useState } from "react";

// Той самий принцип, що й VotingCountdown: рахуємо різницю в часі лише
// ПІСЛЯ монтування на клієнті, а не в тілі рендеру — інакше сервер (UTC) і
// браузер глядача порахують по-різному й React зловить hydration mismatch.
export default function VotingOpensCountdown({ opensAt }: { opensAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      // БЕЗ Math.max(0, ...) — від'ємне значення означає "час уже настав,
      // а адмін ще не відкрив голосування вручну". Раніше компонент у
      // цьому разі просто зникав (return null), і виглядало, ніби таймера
      // взагалі нема.
      setRemaining(new Date(opensAt).getTime() - Date.now());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [opensAt]);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return (
      <div className="rounded-xl border border-gold/20 bg-panel px-4 py-3 text-center">
        <div className="eyebrow mb-1 text-gold-bright">Голосування ось-ось відкриється</div>
        <div className="text-xs text-muted">Орієнтовний час уже настав — чекаємо, поки адмін відкриє його вручну.</div>
      </div>
    );
  }

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
