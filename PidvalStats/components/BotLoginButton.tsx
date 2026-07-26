"use client";

import { useEffect, useRef, useState } from "react";

export default function BotLoginButton({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/telegram-token", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setToken(d.token));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function checkOnce(t: string) {
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
  }

  function startPolling(t: string) {
    tokenRef.current = t;
    setConfirming(true);
    pollRef.current = setInterval(() => checkOnce(t), 2000);

    // Мобільні браузери призупиняють таймери на фоновій вкладці, поки людина
    // в застосунку Telegram — тому додатково перевіряємо одразу, щойно
    // вкладка знову стає активною (плюс людина завжди може натиснути
    // посилання, яке надішле бот — це працює незалежно від цього опитування).
    const onVisible = () => {
      if (document.visibilityState === "visible" && tokenRef.current) {
        checkOnce(tokenRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!token) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <a
        href={`https://t.me/${botUsername}?start=${token}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => startPolling(token)}
        className="flex items-center gap-2 rounded-full bg-gold text-void text-xs font-medium px-3 py-2"
      >
        {confirming ? "Очікуємо підтвердження…" : "Увійти через Telegram"}
      </a>
      {confirming && (
        <p className="text-[10px] text-muted max-w-[220px] leading-snug px-1">
          Бот надішле посилання назад — якщо сторінка сама не оновиться,
          просто натисни на нього.
        </p>
      )}
    </div>
  );
}
