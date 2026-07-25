import PlayerCard from "@/components/PlayerCard";
import { mockTopPlayers, mockTopMatches } from "@/lib/mockData";

export default function CampNouPage() {
  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-ivory mb-8">Барселона</h1>

      {/* TOP 3 ГРАВЦІ */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-ivory">Топ‑3 гравці сезону</h2>
        </div>
        <div className="flex flex-col gap-6">
          {mockTopPlayers.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      </section>

      {/* TOP 3 МАТЧІ */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-ivory">Топ‑3 матчі сезону</h2>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-panel/60 overflow-hidden">
          {mockTopMatches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="text-sm text-ivory">
                  {m.isHome ? "Барселона" : m.opponent} —{" "}
                  {m.isHome ? m.opponent : "Барселона"}
                </div>
                <div className="text-xs text-muted">{m.competition}</div>
              </div>
              <div className="rating-star h-9 w-9 flex items-center justify-center font-utility text-[11px] font-bold">
                {m.avgRating?.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
