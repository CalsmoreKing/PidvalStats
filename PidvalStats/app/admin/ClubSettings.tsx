"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClubSettings({ team }: { team: { id: string; name: string; crest_url: string | null } }) {
  const router = useRouter();
  const [crestUrl, setCrestUrl] = useState(team.crest_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crestUrl: crestUrl || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-panel p-4 flex items-center gap-3 max-w-lg">
      {crestUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={crestUrl} alt="" className="h-10 w-10 object-contain shrink-0" />
      )}
      <input
        value={crestUrl}
        onChange={(e) => setCrestUrl(e.target.value)}
        placeholder="URL герба Барселони"
        className="flex-1 bg-panel-raised rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-muted outline-none"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-gold text-void px-4 py-2 text-sm font-medium disabled:opacity-40 shrink-0"
      >
        {saving ? "…" : saved ? "✓" : "Зберегти"}
      </button>
    </div>
  );
}
