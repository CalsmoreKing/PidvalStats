"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BotLoginButton from "@/components/BotLoginButton";

type Voter = {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export default function AccountPanel() {
  const [voter, setVoter] = useState<Voter | null | undefined>(undefined);
  const [message, setMessage] = useState<"ok" | "expired" | null>(null);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginOutcome = searchParams.get("login");

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

  return (
    <>
      {(message === "expired" || message === "ok") && (
        <div className="fixed z-40 top-14 right-3 md:top-auto md:right-auto md:bottom-16 md:left-4 max-w-[220px] transition-all duration-300">
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

      {/* Один і той самий компактний формат на всіх розмірах екрана —
          кругла аватарка, деталі по кліку. Розмір і положення різні. */}
      <div className="fixed z-30 top-3 right-3 md:top-auto md:right-auto md:bottom-4 md:left-4">
        {voter === undefined ? null : voter ? (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={`h-9 w-9 md:h-10 md:w-10 rounded-full bg-panel-raised border overflow-hidden flex items-center justify-center transition-colors duration-200 ${
                voter.isAdmin ? "border-red-500" : "border-white/10"
              }`}
            >
              {voter.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={voter.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ivory/60">{(voter.displayName ?? "?")[0]}</span>
              )}
            </button>

            <div
              className={`absolute right-0 md:right-auto md:left-0 top-11 md:top-auto md:bottom-12 rounded-lg bg-panel/95 backdrop-blur-sm border border-white/10 px-3 py-2 flex flex-col gap-1.5 min-w-[160px] origin-top-right md:origin-bottom-left transition-all duration-200 ${
                open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="text-xs text-ivory">{voter.displayName}</div>
              {voter.username && <div className="text-[10px] text-muted -mt-1">@{voter.username}</div>}
              <Link href={`/voters/${voter.id}`} className="text-[11px] text-muted hover:text-gold-bright">
                Мої голоси
              </Link>
              <Link href="/settings" className="text-[11px] text-muted hover:text-gold-bright">
                Профіль
              </Link>
              <button onClick={logout} className="text-[11px] text-muted hover:text-gold-bright text-left">
                Вийти
              </button>
            </div>
          </div>
        ) : (
          <BotLoginButton onLoggedIn={refresh} />
        )}
      </div>
    </>
  );
}
