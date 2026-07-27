import SeasonTable from "@/components/SeasonTable";
import { getSeasonRows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const raw = await getSeasonRows();

  const rows = raw.map((p: any) => ({
    id: p.player_id,
    full_name: p.full_name,
    matches: p.matches_rated ?? 0,
    goals: p.total_goals ?? 0,
    assists: p.total_assists ?? 0,
    votes: p.total_votes ?? 0,
    season_rating: p.weighted_season_rating,
  }));

  return (
    <div className="px-4 md:px-12 py-8 max-w-6xl mx-auto">
      <div className="eyebrow mb-3">Підсумки</div>
      <h1 className="font-display text-4xl text-ivory mb-8">Сезон 26/27</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          Ще немає жодного підсумованого матчу — таблиця заповниться після
          першого завершеного голосування.
        </p>
      ) : (
        <SeasonTable rows={rows} />
      )}
    </div>
  );
}
