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
      .then((d) => {
        console.log("[login] отримав токен:", d.token);
        setToken(d.token);
      })
      .catch((e) => console.error("[login] не вдалось отримати токен", e));

    // Слухач вішається ОДИН раз на весь час життя компонента і завжди читає
    // ПОТОЧНИЙ токен з tokenRef — так повторні кліки на кнопку не плодять
    // нових слухачів (раніше саме це залишало старі опитування "в фоні").
    function onVisible() {
      if (document.visibilityState === "visible" && tokenRef.current) {
        console.log("[login] вкладка знову активна — перевіряю одразу");
        checkOnce(tokenRef.current);
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkOnce(t: string) {
    // Якщо за час запиту вже почалось опитування ІНШОГО (нового) токена —
    // ігноруємо застарілу відповідь.
    if (tokenRef.current !== t) return;

    const res = await fetch(`/api/auth/telegram-token/${t}`);
    const data = await res.json().catch(() => null);
    console.log("[login] перевірка статусу токена:", t, res.status, data);

    if (tokenRef.current !== t) return; // ще раз, після await — токен міг змінитись, поки чекали відповідь

    if (data?.status === "claimed") {
      console.log("[login] підтверджено — оновлюю профіль");
      if (pollRef.current) clearInterval(pollRef.current);
      onLoggedIn();
    }
    if (res.status === 404) {
      console.log("[login] токен більше не існує (застарів або вже використаний)");
      if (pollRef.current) clearInterval(pollRef.current);
      setConfirming(false);
    }
  }

  function startPolling(t: string) {
    console.log("[login] почав опитування для токена:", t);
    // Зупиняємо БУДЬ-ЯКЕ попереднє опитування перед стартом нового —
    // саме відсутність цього й спричиняла паралельні "фонові" перевірки
    // старих, уже нерелевантних токенів.
    if (pollRef.current) clearInterval(pollRef.current);
    tokenRef.current = t;
    setConfirming(true);
    pollRef.current = setInterval(() => checkOnce(t), 1500);
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!token) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <a
        href={`https://t.me/${botUsername}?start=${token}`}
        onClick={() => startPolling(token)}
        className="flex items-center gap-2 rounded-full bg-gold text-void text-xs font-medium px-3 py-2"
      >
        {confirming ? "Очікуємо підтвердження…" : "Увійти через Telegram"}
      </a>
      {confirming && (
        <p className="text-[10px] text-muted max-w-[220px] leading-snug px-1">
          Бот надішле посилання назад — використовуй саме останнє його
          повідомлення (не старі з попередніх спроб).
        </p>
      )}
    </div>
  );
}
