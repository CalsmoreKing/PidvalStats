import { mockTopPlayers } from "@/lib/mockData";
import SeasonTable from "@/components/SeasonTable";

// TODO: замінити на запит до view `season_stats` / `season_stats_by_competition`
const seasonRows = mockTopPlayers.map((p, i) => ({
  id: p.id,
  full_name: p.full_name,
  goals: [9, 5, 1][i] ?? 0,
  assists: [8, 6, 0][i] ?? 0,
  votes: [412, 388, 301][i] ?? 0,
  matches: [22, 24, 20][i] ?? 0,
  season_rating: p.season_rating,
}));

export default function SeasonPage() {
  return (
    <div className="px-4 md:px-12 py-8 max-w-6xl mx-auto">
      <div className="eyebrow mb-3">Підсумки</div>
      <h1 className="font-display text-4xl text-ivory mb-8">Сезон 26/27</h1>
      <SeasonTable rows={seasonRows} />
    </div>
  );
}
