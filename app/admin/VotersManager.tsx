"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Voter = {
  id: string;
  display_name: string | null;
  telegram_username: string | null;
  telegram_id: number;
  created_at: string;
};

export default function VotersManager({ voters }: { voters: Voter[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Видалити цього фаната? Він втратить доступ, поки не увійде знову.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/voters/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel max-h-96 overflow-y-auto">
      <div className="flex flex-col divide-y divide-white/5">
        {voters.length === 0 && <p className="text-sm text-muted px-4 py-3">Ще ніхто не заходив.</p>}
        {voters.map((v) => (
          <div key={v.id} className="flex items-center justify-between px-4 py-2 text-xs">
            <div>
              <div className="text-ivory">{v.display_name || "(без імені)"}</div>
              <div className="text-muted">
                {v.telegram_username ? `@${v.telegram_username}` : `id ${v.telegram_id}`}
              </div>
            </div>
            <button
              onClick={() => remove(v.id)}
              disabled={deletingId === v.id}
              className="text-red-400 hover:text-red-300 disabled:opacity-40"
            >
              {deletingId === v.id ? "…" : "видалити"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
