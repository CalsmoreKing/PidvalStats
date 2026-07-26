"use client";

import { useEffect, useRef, useState } from "react";

export default function BotLoginButton({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/telegram-token", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setToken(d.token));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(t: string) {
    setConfirming(true);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/auth/telegram-token/${t}`);
      const data = await res.json();
      if (data.status === "claimed") {
        if (pollRef.current) clearInterval(pollRef.current);
        onLoggedIn();
      }
      if (res.status === 404) {
        if (pollRef.current) clearInterval(pollRef.current);
        setConfirming(false);
      }
    }, 2000);
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!token) return null;

  return (
    <a
      href={`https://t.me/${botUsername}?start=${token}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => startPolling(token)}
      className="flex items-center gap-2 rounded-full bg-gold text-void text-xs font-medium px-3 py-2"
    >
      {confirming ? "Очікуємо підтвердження…" : "Увійти через Telegram"}
    </a>
  );
}
