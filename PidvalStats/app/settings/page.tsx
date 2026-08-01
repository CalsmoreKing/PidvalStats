"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calcAge } from "@/lib/age";
import { ratingColor } from "@/lib/display";

type StatPlayer = {
  id: string;
  full_name: string;
  jersey_number: number | null;
  photo_url: string | null;
  position: string;
  birth_date: string;
  myAverage: number;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const [top, setTop] = useState<StatPlayer[]>([]);
  const [bottom, setBottom] = useState<StatPlayer[]>([]);
  const [histogram, setHistogram] = useState<{ score: number; count: number }[]>([]);

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
    fetch("/api/profile/top-players")
      .then((r) => r.json())
      .then((d) => {
        setTop(d.top ?? []);
        setBottom(d.bottom ?? []);
        setHistogram(d.histogram ?? []);
      });
  }, []);

  async function save(overrideAvatar?: string) {
    setStatus("saving");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarUrl: overrideAvatar ?? avatarUrl }),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/avatar", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setAvatarUrl(data.url);
      await save(data.url);
    }
  }

  if (loading) return null;

  if (!username) {
    return (
      <div className="px-4 md:px-12 py-12 max-w-md mx-auto text-center">
        <p className="text-sm text-muted">Спочатку увійди через Telegram.</p>
      </div>
    );
  }

  const maxHist = Math.max(1, ...histogram.map((h) => h.count));

  return (
    <div className="px-4 md:px-12 py-8 max-w-md mx-auto">
      <div className="eyebrow mb-1">Налаштування</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Профіль</h1>

      <div className="flex flex-col gap-4 mb-10">
        <div>
          <div className="eyebrow mb-1">Юзернейм</div>
          <div className="text-sm text-muted">@{username}</div>
        </div>

        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none"
        />

        <div className="flex items-center gap-3">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <label className="text-xs rounded-lg bg-panel-raised px-3 py-2 cursor-pointer text-ivory hover:text-gold-bright transition-colors duration-150">
            {uploading ? "…" : "Завантажити фото з пристрою"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </label>
        </div>

        <button
          onClick={() => save()}
          disabled={status === "saving"}
          className="self-start rounded-lg bg-gold text-void font-display px-5 py-2 disabled:opacity-40 transition-opacity duration-150"
        >
          {status === "saving" ? "…" : status === "saved" ? "✓" : "Зберегти"}
        </button>
      </div>

      {histogram.some((h) => h.count > 0) && (
        <div className="mb-10">
          <div className="eyebrow mb-3">Твої оцінки</div>
          <div className="flex items-end gap-1 h-20">
            {histogram.map((h) => (
              <div key={h.score} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gold/60"
                  style={{ height: `${Math.max(4, (h.count / maxHist) * 100)}%` }}
                />
                <span className="text-[9px] text-muted font-utility">{h.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {top.length > 0 && <PlayerStatList title="Твої улюблені" items={top} />}
      {bottom.length > 0 && <PlayerStatList title="Твої найгірші" items={bottom} />}
    </div>
  );
}

function PlayerStatList({ title, items }: { title: string; items: StatPlayer[] }) {
  return (
    <div className="mb-10">
      <div className="eyebrow mb-3">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((p, i) => {
          const rc = ratingColor(p.myAverage);
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2 hover:bg-panel-raised transition-colors duration-150"
            >
              <span className="font-display text-gold/50 w-4">{i + 1}</span>
              <div className="h-9 w-9 rounded-full bg-panel-raised overflow-hidden flex items-center justify-center shrink-0">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-ivory/40">{p.full_name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ivory truncate">{p.full_name}</div>
                <div className="text-[10px] text-muted">
                  {p.position} · {calcAge(p.birth_date)} років
                </div>
              </div>
              <div
                className="rating-star h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold"
                style={{ background: rc.bg, color: rc.text }}
              >
                {p.myAverage.toFixed(1)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
