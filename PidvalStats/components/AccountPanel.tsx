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
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginOutcome = searchParams.get("login"); // 'ok' | 'expired' | null

  function refresh() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setVoter(d.voter))
      .catch(() => setVoter(null));
  }

  useEffect(refresh, []);

  useEffect(() => {
    if (loginOutcome === "ok" || loginOutcome === "expired") {
      setMessage(loginOutcome);
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

  const avatarClasses = (isAdmin: boolean) =>
    `h-full w-full rounded-full object-cover ${isAdmin ? "ring-2 ring-red-500" : ""}`;

  return (
    <>
      {/* Повідомлення про результат входу — однакове на всіх розмірах екрана */}
      {(message === "expired" || message === "ok") && (
        <div className="fixed z-40 top-3 right-16 md:top-auto md:right-auto md:bottom-4 md:left-4 max-w-[220px]">
          {message === "expired" && (
            <div className="rounded-lg bg-panel/95 border border-red-400/30 text-red-300 text-[11px] px-3 py-2 flex items-start gap-2">
              <span>Посилання вже недійсне — перевір профіль або спробуй ще раз.</span>
              <button onClick={() => setMessage(null)} className="shrink-0 text-muted hover:text-ivory">✕</button>
            </div>
          )}
          {message === "ok" && (
            <div className="rounded-lg bg-panel/95 border border-gold/30 text-gold-bright text-[11px] px-3 py-2 flex items-center gap-2">
              <span>{voter ? "Вхід підтверджено ✅" : "Підтверджуємо…"}</span>
              <button onClick={() => setMessage(null)} className="shrink-0 text-muted hover:text-ivory">✕</button>
            </div>
          )}
        </div>
      )}

      {/* МОБІЛЬНА версія — маленька кругла аватарка справа зверху, деталі по тапу */}
      <div className="md:hidden fixed z-30 top-3 right-3">
        {voter === undefined ? null : voter ? (
          <div className="relative">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="h-9 w-9 rounded-full bg-panel-raised border border-white/10 overflow-hidden flex items-center justify-center"
            >
              {voter.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={voter.avatarUrl} alt="" className={avatarClasses(voter.isAdmin)} />
              ) : (
                <span className={`text-xs text-ivory/60 ${voter.isAdmin ? "ring-2 ring-red-500 rounded-full h-full w-full flex items-center justify-center" : ""}`}>
                  {(voter.displayName ?? "?")[0]}
                </span>
              )}
            </button>
            {mobileOpen && (
              <div className="absolute top-11 right-0 rounded-lg bg-panel/95 backdrop-blur-sm border border-white/10 px-3 py-2 flex flex-col gap-1.5 min-w-[160px]">
                <div className="text-xs text-ivory">{voter.displayName}</div>
                {voter.username && <div className="text-[10px] text-muted -mt-1">@{voter.username}</div>}
                {voter.isAdmin && (
                  <Link href="/admin" className="text-[11px] text-red-400 hover:text-red-300">
                    Адмінка
                  </Link>
                )}
                <Link href="/settings" className="text-[11px] text-muted hover:text-gold-bright">
                  Профіль
                </Link>
                <button onClick={logout} className="text-[11px] text-muted hover:text-gold-bright text-left">
                  Вийти
                </button>
              </div>
            )}
          </div>
        ) : (
          <BotLoginButton onLoggedIn={refresh} />
        )}
      </div>

      {/* ДЕСКТОП версія — компактна панель знизу зліва, ширина обмежена */}
      <div className="hidden md:flex fixed z-30 bottom-4 left-4 max-w-[210px]">
        {voter === undefined ? null : voter ? (
          <div className="flex items-center gap-2 rounded-full bg-panel/90 backdrop-blur-sm border border-white/10 pl-1.5 pr-2 py-1.5 max-w-full">
            <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-panel-raised flex items-center justify-center">
              {voter.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={voter.avatarUrl} alt="" className={avatarClasses(voter.isAdmin)} />
              ) : (
                <span className={`text-[10px] text-ivory/50 ${voter.isAdmin ? "ring-2 ring-red-500 rounded-full h-full w-full flex items-center justify-center" : ""}`}>
                  {(voter.displayName ?? "?")[0]}
                </span>
              )}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-xs text-ivory truncate">{voter.displayName}</div>
              {voter.username && <div className="text-[10px] text-muted truncate">@{voter.username}</div>}
            </div>
            {voter.isAdmin && (
              <Link href="/admin" className="text-[10px] text-red-400 hover:text-red-300 shrink-0">
                адмін
              </Link>
            )}
            <Link href="/settings" className="text-[10px] text-muted hover:text-gold-bright shrink-0">
              профіль
            </Link>
            <button onClick={logout} className="text-[10px] text-muted hover:text-gold-bright shrink-0">
              вийти
            </button>
          </div>
        ) : (
          <BotLoginButton onLoggedIn={refresh} />
        )}
      </div>
    </>
  );
}
