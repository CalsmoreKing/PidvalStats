"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.voter) {
          setUsername(d.voter.username);
          setDisplayName(d.voter.displayName ?? "");
          setAvatarUrl(d.voter.avatarUrl ?? "");
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarUrl }),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  if (loading) return null;

  if (!username) {
    return (
      <div className="px-4 md:px-12 py-12 max-w-md mx-auto text-center">
        <p className="text-sm text-muted">Спочатку увійди через Telegram.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-12 py-8 max-w-md mx-auto">
      <div className="eyebrow mb-1">Налаштування</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Профіль</h1>

      <div className="flex flex-col gap-4">
        <div>
          <div className="eyebrow mb-1">Юзернейм (з Telegram)</div>
          <div className="text-sm text-muted">@{username}</div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="eyebrow">Ім'я, яке бачать інші</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="eyebrow">URL аватарки</span>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
          />
        </label>

        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover self-start" />
        )}

        <button
          onClick={save}
          disabled={status === "saving"}
          className="self-start rounded-lg bg-gold text-void font-display px-5 py-2 disabled:opacity-40"
        >
          {status === "saving" ? "Зберігаємо…" : status === "saved" ? "Збережено ✓" : "Зберегти"}
        </button>
      </div>
    </div>
  );
}
