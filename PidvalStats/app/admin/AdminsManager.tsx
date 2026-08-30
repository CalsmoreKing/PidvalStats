"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminRow = {
  id: string;
  role: string;
  title: string | null;
  voter_id: string;
  voter: {
    display_name: string | null;
    telegram_username: string | null;
    custom_display_name: string | null;
    custom_avatar_url: string | null;
    avatar_url: string | null;
  } | null;
};

function adminName(a: AdminRow) {
  const v = a.voter;
  return v?.custom_display_name || v?.display_name || v?.telegram_username || "Адмін";
}

function AdminRowItem({ a, isOwnerViewer }: { a: AdminRow; isOwnerViewer: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(a.title ?? "");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function saveTitle() {
    setSaving(true);
    await fetch(`/api/admin/admins/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Зняти ${adminName(a)} з адмінів?`)) return;
    setRemoving(true);
    await fetch(`/api/admin/admins/${a.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs">
      <div className="w-36 truncate text-ivory">{adminName(a)}</div>
      <span className="eyebrow shrink-0">{a.role === "owner" ? "власник" : "адмін"}</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        placeholder="посада (напр. Розробник)"
        className="flex-1 min-w-[140px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
      />
      {saving && <span className="text-muted shrink-0">…</span>}
      {isOwnerViewer && a.role !== "owner" && (
        <button
          onClick={remove}
          disabled={removing}
          className="text-red-400 hover:text-red-300 shrink-0 px-2 py-1 rounded hover:bg-white/5 transition-colors duration-150"
        >
          {removing ? "…" : "Зняти"}
        </button>
      )}
    </div>
  );
}

export default function AdminsManager({
  admins,
  helpers,
  isOwnerViewer,
}: {
  admins: AdminRow[];
  helpers: { id: string; name: string; title: string | null }[];
  isOwnerViewer: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function grant() {
    if (!username.trim()) return;
    setStatus("saving");
    setMsg("");
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramUsername: username.replace(/^@/, ""), title: newTitle || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Не вдалось призначити адміна");
      setStatus("error");
      return;
    }
    setMsg(`Готово — @${username.replace(/^@/, "")} тепер адмін`);
    setUsername("");
    setNewTitle("");
    setStatus("done");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-white/5 bg-panel divide-y divide-white/5">
        {admins.length === 0 && <p className="text-xs text-muted px-4 py-4">Ще немає жодного адміна.</p>}
        {admins.map((a) => (
          <AdminRowItem key={a.id} a={a} isOwnerViewer={isOwnerViewer} />
        ))}
      </div>

      {isOwnerViewer && (
        <div className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3 max-w-sm">
          <p className="text-xs text-muted">
            Людина має хоча б раз залогінитись через Telegram на сайті, перш ніж її можна знайти тут за юзернеймом.
          </p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="telegram_username"
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
          />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="посада (необов'язково, можна пізніше)"
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
          />
          <button
            onClick={grant}
            disabled={status === "saving"}
            className="self-start rounded-lg bg-gold text-void px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {status === "saving" ? "…" : "Призначити"}
          </button>
          {msg && (
            <div className={`text-xs ${status === "error" ? "text-red-400" : "text-gold-bright"}`}>{msg}</div>
          )}
        </div>
      )}

      <HelpersSection helpers={helpers} isOwnerViewer={isOwnerViewer} />
    </div>
  );
}

type Helper = { id: string; name: string; title: string | null };

function HelperRow({ h, isOwnerViewer }: { h: Helper; isOwnerViewer: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(h.name);
  const [title, setTitle] = useState(h.title ?? "");
  const [removing, setRemoving] = useState(false);

  async function save(patch: { name?: string; title?: string }) {
    await fetch(`/api/admin/helpers/${h.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Прибрати ${h.name} зі списку помічників?`)) return;
    setRemoving(true);
    await fetch(`/api/admin/helpers/${h.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() !== h.name && save({ name })}
        className="w-36 shrink-0 bg-panel-raised rounded px-2 py-1.5 text-ivory outline-none"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== (h.title ?? "") && save({ title })}
        placeholder="посада (напр. Тестувальник)"
        className="flex-1 min-w-[140px] bg-panel-raised rounded px-2 py-1.5 text-ivory placeholder:text-muted outline-none"
      />
      {isOwnerViewer && (
        <button
          onClick={remove}
          disabled={removing}
          className="text-red-400 hover:text-red-300 shrink-0 px-2 py-1 rounded hover:bg-white/5 transition-colors duration-150"
        >
          {removing ? "…" : "Прибрати"}
        </button>
      )}
    </div>
  );
}

function HelpersSection({ helpers, isOwnerViewer }: { helpers: Helper[]; isOwnerViewer: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function add() {
    if (!name.trim()) return;
    setStatus("saving");
    setMsg("");
    const res = await fetch("/api/admin/helpers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title: title || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Не вдалось додати");
      setStatus("error");
      return;
    }
    setName("");
    setTitle("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="eyebrow mb-2 px-1">Помічники (без доступу до адмінки)</div>
        <p className="text-[11px] text-muted px-1 mb-2">
          Тестувальники, дизайнери тощо — з'являються в "Контакт", але не отримують доступу до цієї панелі.
        </p>
        <div className="rounded-xl border border-white/5 bg-panel divide-y divide-white/5">
          {helpers.length === 0 && <p className="text-xs text-muted px-4 py-4">Ще нікого не додано.</p>}
          {helpers.map((h) => (
            <HelperRow key={h.id} h={h} isOwnerViewer={isOwnerViewer} />
          ))}
        </div>
      </div>

      {isOwnerViewer && (
        <div className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3 max-w-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ім'я"
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="посада (напр. Дизайнер)"
            className="bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
          />
          <button
            onClick={add}
            disabled={status === "saving"}
            className="self-start rounded-lg bg-gold text-void px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {status === "saving" ? "…" : "Додати"}
          </button>
          {msg && <div className="text-xs text-red-400">{msg}</div>}
        </div>
      )}
    </div>
  );
}
