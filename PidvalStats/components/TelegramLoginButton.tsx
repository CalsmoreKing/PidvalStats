"use client";

import { useEffect, useRef } from "react";

// Класичний (legacy, але повністю підтримуваний) Telegram Login Widget.
// Юзернейм бота задається через NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (без @).
// Після успішного логіну Telegram сам зробить редірект на
// /api/auth/telegram?...&hash=... — це вже реалізовано в app/api/auth/telegram/route.ts
export default function TelegramLoginButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.childElementCount > 0) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute(
      "data-telegram-login",
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""
    );
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-auth-url", "/api/auth/telegram");
    script.setAttribute("data-request-access", "write");

    ref.current.appendChild(script);
  }, []);

  return <div ref={ref} />;
}
