"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeStandings, fmt1, fmt2, autoLinkProposals, VoterLite } from "@/lib/award";
import VoterPicker from "./VoterPicker";

type Voter = VoterLite & { created_at?: string };

// datetime-local ↔ ISO (локальний пояс адміна)
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
    return { ok: res.ok, data: d };
  }

  // Автоприв'язка: один раз при відкритті вкладки (якщо є ще не прив'язані)
  // і за кнопкою. Сервер сам вирішує, що однозначно (Telegram ID, точне ім'я).
  const ran = useRef(false);
  const active = data.nominees.filter((n) => n.is_active);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (active.some((n) => !n.voter_id)) {
      fetch("/api/admin/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_link" }),
      })
        .then((r) => r.json())
        .then((d) => {
          const n = (d.byTelegramId ?? 0) + (d.byName ?? 0);
          if (n > 0) {
            setMsg(`Автоматично прив'язано акаунтів: ${n}`);
            router.refresh();
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vname = (v?: Voter) => (v ? v.custom_display_name || v.display_name || v.telegram_username || "—" : "—");
  const voterById = useMemo(() => new Map(voters.map((v) => [v.id, v])), [voters]);
  const takenIds = new Set(active.map((n) => n.voter_id).filter(Boolean) as string[]);
  const pendingAuto = autoLinkProposals(active, voters).length;
  const unlinked = active.filter((n) => !n.voter_id).length;

  const live = computeStandings({
    nominees: active,
    votes: data.votes,
    matchesVoted: data.matchesVoted,
    totalMatches: data.totalMatches,
    settings: s,
    includeVotes: true,
  });
  const wSum = Number(s.weight_base) + Number(s.weight_votes) + Number(s.weight_activity) || 1;
  const pct = (w: number) => Math.round((Number(w) / wSum) * 100);

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
            <span className="eyebrow">Мін. оцінених матчів, щоб голосувати</span>
            <input type="number" min={0} className={input} value={s.min_matches_voted} onChange={(e) => setS({ ...s, min_matches_voted: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Оцінок у «повному комплекті» матчу</span>
            <input type="number" min={1} className={input} value={s.min_complete_ratings} onChange={(e) => setS({ ...s, min_complete_ratings: e.target.value })} />
            <span className="text-[10px] text-muted">Матч зараховується в «Активність на сайті», лише якщо оцінено щонайменше стільки гравців.</span>
          </label>
          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            {(["weight_base", "weight_votes", "weight_activity"] as const).map((k, i) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="eyebrow">{["Вага статистики", "Вага голосів", "Вага сайту"][i]}</span>
                <input type="number" min={0} className={input} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={() =>
            call({
              action: "settings",
              settings: { ...s, closes_at: fromLocal(s.closes_at), registered_before: fromLocal(s.registered_before) },
            })
          }
          className="self-start rounded-lg bg-panel-raised border border-gold/30 text-gold-bright px-4 py-2 text-xs"
        >
          Зберегти налаштування
        </button>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3 flex-wrap mb-1">
          <h3 className="font-display text-lg text-ivory">Номінанти й живий підсумок</h3>
          <button
            onClick={async () => {
              const r = await call({ action: "auto_link" });
              if (r.ok) setMsg(`Прив'язано: за Telegram ID — ${r.data.byTelegramId}, за точним іменем — ${r.data.byName}`);
            }}
            className="rounded-lg border border-gold/30 text-gold-bright px-3 py-1.5 text-xs"
          >
            Автоприв&apos;язка{pendingAuto > 0 ? ` (${pendingAuto} за іменем)` : ""}
          </button>
        </div>
        <p className="text-[11px] text-muted mb-3 leading-relaxed">
          Підсумок = {pct(s.weight_base)}% статистика + {pct(s.weight_votes)}% голосування + {pct(s.weight_activity)}% сайт. У рядку
          справа: <span className="text-ivory">статистика + голоси + сайт = разом</span> (вже зважено). Поки голосів немає, є лише
          внесок статистики ({pct(s.weight_base)}% від її балу). Сайт рахується лише для прив&apos;язаних акаунтів:{" "}
          {unlinked > 0 ? (
            <span className="text-ivory">{unlinked} ще без акаунта — вони не заходили на сайт.</span>
          ) : (
            "усі номінанти прив'язані."
          )}
        </p>
        <div className="flex flex-col gap-2">
          {live.map((st, i) => {
            const linked = !!st.nominee.voter_id;
            return (
              <div key={st.nominee.id} className="rounded-lg bg-panel px-3 py-3 flex flex-col gap-2 md:grid md:grid-cols-[28px_1.1fr_1.5fr_auto_auto] md:items-center md:gap-3">
                <span className="font-display text-gold/50 hidden md:block">{i + 1}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display text-gold/50 md:hidden w-6">{i + 1}</span>
                  <input
                    defaultValue={st.nominee.name}
                    onBlur={(e) => e.target.value !== st.nominee.name && call({ action: "update_nominee", id: st.nominee.id, name: e.target.value })}
                    className={`${input} flex-1 min-w-0`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={st.statScore.toFixed(2)}
                    onBlur={(e) => Number(e.target.value) !== Number(st.statScore.toFixed(2)) && call({ action: "update_nominee", id: st.nominee.id, base_points: e.target.value })}
                    className={`${input} w-24 shrink-0`}
                    title="Статистичний бал"
                  />
                </div>
                <VoterPicker
                  nomineeName={st.nominee.name}
                  voters={voters}
                  takenIds={takenIds}
                  selectedId={st.nominee.voter_id}
                  onPick={(id) => call({ action: "update_nominee", id: st.nominee.id, voter_id: id })}
                />
                <span className={`text-[11px] whitespace-nowrap ${linked ? "text-green-400" : "text-muted"}`}>
                  {linked ? `на сайті · ${st.siteDone} матч.` : "не на сайті"}
                </span>
                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <span className="font-utility text-[11px] text-muted whitespace-nowrap" title="статистика + голоси + сайт = разом">
                    {fmt1(st.statPart)} + {fmt1(st.votePart)} + {fmt1(st.sitePart)} ={" "}
                    <span className="text-gold-bright text-sm font-bold">{fmt2(st.total)}</span>
                  </span>
                  <button
                    onClick={() => call({ action: "update_nominee", id: st.nominee.id, is_active: false })}
                    className="text-xs text-red-400"
                    title="Прибрати зі списку"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
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
        <div className="flex gap-2 mt-3 flex-wrap">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Новий номінант" className={`${input} flex-1 min-w-[160px]`} />
          <input value={newBase} onChange={(e) => setNewBase(e.target.value)} placeholder="Стат. бал" className={`${input} max-w-[110px]`} />
          <button
            onClick={async () => {
              await call({ action: "add_nominee", name: newName, base_points: newBase });
              setNewName("");
              setNewBase("");
            }}
            className="rounded-lg border border-gold/30 text-gold-bright px-4 py-2 text-xs whitespace-nowrap"
          >
            Додати
          </button>
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg text-ivory mb-1">Бюлетені ({ballots.length})</h3>
        <p className="text-[11px] text-muted mb-3">
          Бачиш лише хто голосував і коли створено акаунт — самих виборів ні. Підозрілий бюлетень (свіжий акаунт,
          нуль оцінених матчів) можна відхилити — він перестане враховуватись.
        </p>
        <div className="flex flex-col gap-1">
          {ballots.map((b) => {
            const v = voterById.get(b.voter_id);
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2 text-xs flex-wrap">
                <span className={`flex-1 min-w-[140px] truncate ${b.is_valid ? "text-ivory" : "text-muted line-through"}`}>
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
