"use client";

import { useEffect, useState } from "react";

export default function VotingCountdown({ closesAt }: { closesAt: string }) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, new Date(closesAt).getTime() - Date.now())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(closesAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  const totalSec = Math.floor(remaining / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  if (remaining <= 0) {
    return <span className="text-muted">підраховуємо…</span>;
  }

  return (
    <span className="font-utility text-gold-bright">
      {min}:{sec.toString().padStart(2, "0")}
    </span>
  );
}
