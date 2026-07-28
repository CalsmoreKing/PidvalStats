"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BotLoginButton from "@/components/BotLoginButton";

type Voter = {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export default function AccountPanel() {
  const [voter, setVoter] = useState<Voter | null | undefined>(undefined); // undefined = ще завантажується
  const [message, setMessage] = useState<"ok" | "expired" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginOutcome = searchParams.get("login"); // 'ok' | 'expired' | null

  function refresh() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        console.log("[account] /api/auth/me →", d);
        setVoter(d.voter);
      })
      .catch((e) => {
        console.error("[account] /api/auth/me failed", e);
        setVoter(null);
      });
  }

  useEffect(refresh, []);

  useEffect(() => {
    if (loginOutcome === "ok" || loginOutcome === "expired") {
      console.log("[account] login outcome from URL:", loginOutcome);
      setMessage(loginOutcome); // тримаємо в стані — не зникне, коли приберемо параметр з URL
      refresh();
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      router.replace(url.pathname + url.search, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginOutcome]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="fixed z-30 left-3 bottom-20 md:bottom-4 md:left-4 flex flex-col items-start gap-2">
      {message === "expired" && (
        <div className="rounded-lg bg-panel/95 border border-red-400/30 text-red-300 text-[11px] px-3 py-2 max-w-[240px] flex items-start gap-2">
          <span>
            Посилання вже недійсне (можливо, вхід уже відбувся в іншій
            вкладці — перевір профіль нижче). Якщо ні, спробуй ще раз.
          </span>
          <button onClick={() => setMessage(null)} className="shrink-0 text-muted hover:text-ivory">
            ✕
          </button>
        </div>
      )}
      {message === "ok" && (
        <div className="rounded-lg bg-panel/95 border border-gold/30 text-gold-bright text-[11px] px-3 py-2 flex items-center gap-2">
          <span>{voter ? "Вхід підтверджено ✅" : "Підтверджуємо…"}</span>
          <button onClick={() => setMessage(null)} className="shrink-0 text-muted hover:text-ivory">
            ✕
          </button>
        </div>
      )}

      {voter === undefined ? null : voter ? (
        <div className="flex items-center gap-2 rounded-full bg-panel/90 backdrop-blur-sm border border-white/10 pl-1.5 pr-3 py-1.5">
          {voter.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voter.avatarUrl}
              alt=""
              className={`h-7 w-7 rounded-full object-cover ${
                voter.isAdmin ? "ring-2 ring-red-500" : ""
              }`}
            />
          ) : (
            <div
              className={`h-7 w-7 rounded-full bg-panel-raised flex items-center justify-center text-[10px] text-ivory/50 ${
                voter.isAdmin ? "ring-2 ring-red-500" : ""
              }`}
            >
              {(voter.displayName ?? "?")[0]}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-xs text-ivory">{voter.displayName}</div>
            {voter.username && <div className="text-[10px] text-muted">@{voter.username}</div>}
          </div>
          {voter.isAdmin && (
            <Link href="/admin" className="text-[10px] text-red-400 hover:text-red-300 ml-1">
              адмінка
            </Link>
          )}
          <button onClick={logout} className="text-[10px] text-muted hover:text-gold-bright ml-1">
            вийти
          </button>
        </div>
      ) : (
        <BotLoginButton onLoggedIn={refresh} />
      )}
    </div>
  );
}
