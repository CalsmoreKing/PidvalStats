import { mockTopPlayers } from "@/lib/mockData";

// TODO: замінити на запит до view `season_stats` / `season_stats_by_competition`
const seasonRows = mockTopPlayers.map((p, i) => ({
  ...p,
  goals: [9, 5, 1][i] ?? 0,
  assists: [8, 6, 0][i] ?? 0,
  votes: [412, 388, 301][i] ?? 0,
  matches: [22, 24, 20][i] ?? 0,
}));

const competitionTabs = ["Всі", "Ла Ліга", "Кубок Іспанії", "Ліга чемпіонів", "Товариські"];

export default function SeasonPage() {
  return (
    <div className="px-4 md:px-12 py-8 max-w-6xl mx-auto">
      <div className="eyebrow mb-3">Підсумки</div>
      <h1 className="font-display text-4xl text-ivory mb-8">Сезон 26/27</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {competitionTabs.map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              i === 0
                ? "bg-panel-raised border-gold/40 text-gold-bright"
                : "border-white/10 text-muted hover:border-white/25"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel-raised text-muted eyebrow text-left">
              <th className="px-5 py-3 font-normal">#</th>
              <th className="px-5 py-3 font-normal">Гравець</th>
              <th className="px-5 py-3 font-normal text-right">Матчі</th>
              <th className="px-5 py-3 font-normal text-right">Голи</th>
              <th className="px-5 py-3 font-normal text-right">Асисти</th>
              <th className="px-5 py-3 font-normal text-right">Голоси</th>
              <th className="px-5 py-3 font-normal text-right">Рейтинг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {seasonRows.map((p, i) => (
              <tr key={p.id} className="bg-panel/80 hover:bg-transparent transition-colors">
                <td className="px-5 py-4 font-display text-gold/50">{i + 1}</td>
                <td className="px-5 py-4 text-ivory">{p.full_name}</td>
                <td className="px-5 py-4 text-right font-utility text-muted">
                  {p.matches}
                </td>
                <td className="px-5 py-4 text-right font-utility text-muted">
                  {p.goals}
                </td>
                <td className="px-5 py-4 text-right font-utility text-muted">
                  {p.assists}
                </td>
                <td className="px-5 py-4 text-right font-utility text-muted">
                  {p.votes}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="rating-star inline-flex h-9 w-9 items-center justify-center font-utility text-xs font-bold">
                    {p.season_rating?.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
