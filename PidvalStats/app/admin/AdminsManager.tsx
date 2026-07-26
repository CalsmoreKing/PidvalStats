"use client";

import { useState } from "react";

export default function AdminsManager() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function grant() {
    if (!username.trim()) return;
    setStatus("saving");
    setMsg("");
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramUsername: username.replace(/^@/, "") }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Не вдалось призначити адміна");
      setStatus("error");
      return;
    }
    setMsg(`Готово — @${username.replace(/^@/, "")} тепер адмін`);
    setUsername("");
    setStatus("done");
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3 max-w-sm">
      <p className="text-xs text-muted">
        Людина має хоча б раз залогінитись через Telegram на сайті, перш ніж
        її можна знайти тут за юзернеймом.
      </p>
      <div className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="telegram_username"
          className="flex-1 bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
        />
        <button
          onClick={grant}
          disabled={status === "saving"}
          className="rounded-lg bg-gold text-void px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {status === "saving" ? "…" : "Призначити"}
        </button>
      </div>
      {msg && (
        <div className={`text-xs ${status === "error" ? "text-red-400" : "text-gold-bright"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
