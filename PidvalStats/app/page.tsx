import PlayerCard from "@/components/PlayerCard";
import { mockTopPlayers, mockTopMatches } from "@/lib/mockData";

export default function CampNouPage() {
  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
      {/* HERO */}
      <section className="mb-16">
        <div className="eyebrow mb-3">Camp Nou · Сезон 26/27</div>
        <h1 className="font-display text-4xl md:text-6xl font-semibold text-ivory leading-[1.05] max-w-2xl">
          Голос трибун<br />
          <span className="text-gold-bright">має вагу.</span>
        </h1>
        <p className="mt-5 text-muted max-w-md">
          Оцінюй гравців після кожного матчу. Одна людина — один голос.
          Результат видно лише після фінального свистка голосування.
        </p>
        <div className="hairline mt-10" />
      </section>

      {/* TOP 3 ГРАВЦІ */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-ivory">Топ‑3 гравці сезону</h2>
          <span className="eyebrow">за середньою оцінкою</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockTopPlayers.map((p, i) => (
            <div key={p.id} className="relative">
              <span className="absolute -top-3 -left-2 z-10 font-display text-3xl text-gold/40">
                {i + 1}
              </span>
              <PlayerCard player={p} />
            </div>
          ))}
        </div>
      </section>

      {/* TOP 3 МАТЧІ */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-ivory">Топ‑3 матчі сезону</h2>
          <span className="eyebrow">за середньою оцінкою складу</span>
        </div>
        <div className="flex flex-col divide-y divide-white/5 rounded-xl border border-white/5 bg-panel/60 overflow-hidden">
          {mockTopMatches.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-xl text-gold/50">{i + 1}</span>
                <div>
                  <div className="text-ivory">
                    {m.isHome ? "Барселона" : m.opponent} —{" "}
                    {m.isHome ? m.opponent : "Барселона"}
                  </div>
                  <div className="text-xs text-muted">{m.competition}</div>
                </div>
              </div>
              <div className="medal-seal h-10 w-10 rounded-full flex items-center justify-center font-utility text-sm font-bold">
                {m.avgRating?.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
