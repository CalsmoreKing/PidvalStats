"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { computeStandings } from "@/lib/award";

type Voter = { id: string; display_name: string | null; telegram_username: string | null; custom_display_name?: string | null };

// toLocal / fromLocal: datetime-local ↔ ISO (локальний пояс адміна)
const toLocal = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

export default function AwardManager({
  data,
  voters,
  ballots,
}: {
  data: { settings: any; nominees: any[]; votes: any; matchesVoted: Record<string, number>; totalMatches: number };
  voters: Voter[];
  ballots: { id: string; voter_id: string; is_valid: boolean; created_at: string }[];
}) {
  const router = useRouter();
  const [s, setS] = useState({
    ...data.settings,
    closes_at: toLocal(data.settings.closes_at),
    registered_before: toLocal(data.settings.registered_before),
  });
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newBase, setNewBase] = useState("");

  async function call(body: any, ok = "Збережено") {
    setMsg("");
    const res = await fetch("/api/admin/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? ok : d.error ?? "Помилка");
    if (res.ok) router.refresh();
  }

  const vname = (v?: Voter) => v?.custom_display_name || v?.display_name || v?.telegram_username || "—";
  const voterById = new Map(voters.map((v) => [v.id, v]));
  const live = computeStandings({
    nominees: data.nominees.filter((n) => n.is_active),
    votes: data.votes,
    matchesVoted: data.matchesVoted,
    totalMatches: data.totalMatches,
    settings: s,
    includeVotes: true,
  });
  const input = "bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory outline-none w-full";

  return (
    <div className="flex flex-col gap-8">
      {msg && <div className="text-xs text-gold-bright">{msg}</div>}

      <section className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3">
        <h3 className="font-display text-lg text-ivory">Налаштування</h3>
        <div className="flex flex-wrap gap-6 text-sm text-ivory">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!s.is_open} onChange={(e) => setS({ ...s, is_open: e.target.checked })} />
            Голосування відкрите
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!s.show_results} onChange={(e) => setS({ ...s, show_results: e.target.checked })} />
            Показати підсумок усім (вмикай після закриття)
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Автозакриття</span>
            <input type="datetime-local" className={input} value={s.closes_at} onChange={(e) => setS({ ...s, closes_at: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Акаунт створено не пізніше</span>
            <input type="datetime-local" className={input} value={s.registered_before} onChange={(e) => setS({ ...s, registered_before: e.target.value })} />
            <span className="text-[10px] text-muted">Захист від нових акаунтів, зареєстрованих «під голосування».</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Мін. оцінених матчів для голосу</span>
            <input type="number" min={0} className={input} value={s.min_matches_voted} onChange={(e) => setS({ ...s, min_matches_voted: e.target.value })} />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["weight_base", "weight_votes", "weight_activity"] as const).map((k, i) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="eyebrow">{["Вага бази", "Вага голосів", "Вага активн."][i]}</span>
                <input type="number" min={0} className={input} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={() => call({ action: "settings", settings: { ...s, closes_at: fromLocal(s.closes_at), registered_before: fromLocal(s.registered_before) } })}
          className="self-start rounded-lg bg-panel-raised border border-gold/30 text-gold-bright px-4 py-2 text-xs"
        >
          Зберегти налаштування
        </button>
      </section>

      <section>
        <h3 className="font-display text-lg text-ivory mb-1">Номінанти й живий підсумок</h3>
        <p className="text-[11px] text-muted mb-3">
          Прив&apos;яжи кожного номінанта до його акаунта на сайті — тоді сайт точно заблокує голос за себе й
          порахує бонус активності. Без прив&apos;язки діє лише збіг імені.
        </p>
        <div className="flex flex-col gap-2">
          {live.map((st, i) => (
            <div key={st.nominee.id} className="grid grid-cols-[28px_1.2fr_80px_1.2fr_auto_auto] gap-2 items-center rounded-lg bg-panel px-3 py-2 text-sm">
              <span className="font-display text-gold/50">{i + 1}</span>
              <input defaultValue={st.nominee.name} onBlur={(e) => e.target.value !== st.nominee.name && call({ action: "update_nominee", id: st.nominee.id, name: e.target.value })} className={input} />
              <input type="number" step="0.01" defaultValue={st.basePoints} onBlur={(e) => Number(e.target.value) !== st.basePoints && call({ action: "update_nominee", id: st.nominee.id, base_points: e.target.value })} className={input} />
              <select defaultValue={st.nominee.voter_id ?? ""} onChange={(e) => call({ action: "update_nominee", id: st.nominee.id, voter_id: e.target.value || null })} className={input}>
                <option value="">— акаунт не прив&apos;язано —</option>
                {voters.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vname(v)}{v.telegram_username ? ` (@${v.telegram_username})` : ""}
                  </option>
                ))}
              </select>
              <span className="font-utility text-xs text-gold-bright whitespace-nowrap" title="голоси / разом">
                {st.votePoints} · {st.total.toFixed(1)}
              </span>
              <button onClick={() => call({ action: "update_nominee", id: st.nominee.id, is_active: false })} className="text-xs text-red-400" title="Прибрати зі списку">
                ✕
              </button>
            </div>
          ))}
        </div>
        {data.nominees.some((n) => !n.is_active) && (
          <div className="mt-3 text-xs text-muted">
            Прибрані:{" "}
            {data.nominees.filter((n) => !n.is_active).map((n) => (
              <button key={n.id} onClick={() => call({ action: "update_nominee", id: n.id, is_active: true })} className="mr-2 underline">
                {n.name} (повернути)
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Новий номінант" className={input} />
          <input value={newBase} onChange={(e) => setNewBase(e.target.value)} placeholder="Бали" className={`${input} max-w-[110px]`} />
          <button
            onClick={async () => { await call({ action: "add_nominee", name: newName, base_points: newBase }); setNewName(""); setNewBase(""); }}
            className="rounded-lg border border-gold/30 text-gold-bright px-4 text-xs whitespace-nowrap"
          >
            Додати
          </button>
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg text-ivory mb-1">Бюлетені ({ballots.length})</h3>
        <p className="text-[11px] text-muted mb-3">
          Бачиш лише хто голосував і коли створено акаунт — самих виборів ні. Підозрілий бюлетень (свіжий
          акаунт, нуль оцінених матчів) можна відхилити — він перестане враховуватись.
        </p>
        <div className="flex flex-col gap-1">
          {ballots.map((b) => {
            const v = voterById.get(b.voter_id) as any;
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2 text-xs">
                <span className={`flex-1 truncate ${b.is_valid ? "text-ivory" : "text-muted line-through"}`}>
                  {vname(v)} {v?.telegram_username && <span className="text-muted">@{v.telegram_username}</span>}
                </span>
                <span className="text-muted">акаунт: {v?.created_at ? new Date(v.created_at).toLocaleDateString("uk-UA") : "—"}</span>
                <span className="text-muted">матчів: {data.matchesVoted[b.voter_id] ?? 0}</span>
                <button onClick={() => call({ action: "set_ballot_valid", id: b.id, is_valid: !b.is_valid })} className={b.is_valid ? "text-red-400" : "text-gold-bright"}>
                  {b.is_valid ? "відхилити" : "повернути"}
                </button>
              </div>
            );
          })}
          {ballots.length === 0 && <p className="text-xs text-muted">Поки немає голосів.</p>}
        </div>
      </section>
    </div>
  );
}
