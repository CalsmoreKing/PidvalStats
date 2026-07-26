"use client";

import { useEffect, useState } from "react";
import BotLoginButton from "@/components/BotLoginButton";

type Voter = { displayName: string | null; username: string | null; avatarUrl: string | null };

export default function AccountPanel() {
  const [voter, setVoter] = useState<Voter | null | undefined>(undefined); // undefined = ще завантажується

  function refresh() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setVoter(d.voter))
      .catch(() => setVoter(null));
  }

  useEffect(refresh, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="fixed z-30 left-3 bottom-20 md:bottom-4 md:left-4">
      {voter === undefined ? null : voter ? (
        <div className="flex items-center gap-2 rounded-full bg-panel/90 backdrop-blur-sm border border-white/10 pl-1.5 pr-3 py-1.5">
          {voter.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={voter.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-panel-raised flex items-center justify-center text-[10px] text-ivory/50">
              {(voter.displayName ?? "?")[0]}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-xs text-ivory">{voter.displayName}</div>
            {voter.username && <div className="text-[10px] text-muted">@{voter.username}</div>}
          </div>
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
