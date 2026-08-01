import SeasonTable from "@/components/SeasonTable";
import { getSeasonRows, getSeasonRowsByCompetition, getCompetitions, getSeasonRefereeRatings, getSeasonCoachRatings } from "@/lib/queries";
import { ratingColor } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const [raw, byCompetitionRaw, competitions, refereeRatings, coachRatings] = await Promise.all([
    getSeasonRows(),
    getSeasonRowsByCompetition(),
    getCompetitions(),
    getSeasonRefereeRatings(),
    getSeasonCoachRatings(),
  ]);

  const rows = raw.map((p: any) => ({
    id: p.player_id,
    full_name: p.full_name,
    matches: p.matches_rated ?? 0,
    goals: p.total_goals ?? 0,
    assists: p.total_assists ?? 0,
    votes: p.total_votes ?? 0,
    season_rating: p.weighted_season_rating,
  }));

  const rosterIds = new Set(rows.map((r) => r.id));
  const byCompetition = byCompetitionRaw
    .filter((r: any) => rosterIds.has(r.player_id))
    .map((r: any) => ({
      id: r.player_id,
      competitionSlug: r.competition_slug,
      matches: r.matches_played,
      season_rating: r.avg_rating,
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
        <SeasonTable rows={rows} byCompetition={byCompetition} competitions={competitions} />
      )}

      {coachRatings.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl text-ivory mb-4">Оцінки тренера</h2>
          <RatingList items={coachRatings} />
        </div>
      )}

      {refereeRatings.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl text-ivory mb-4">Оцінки рефері</h2>
          <RatingList items={refereeRatings} />
        </div>
      )}
    </div>
  );
}

function RatingList({ items }: { items: { name: string; matches: number; avg_rating: number }[] }) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden max-w-md">
      <div className="flex flex-col divide-y divide-white/5">
        {items.map((it) => {
          const rc = ratingColor(it.avg_rating);
          return (
            <div key={it.name} className="flex items-center justify-between px-5 py-3 bg-panel/80">
              <div>
                <div className="text-sm text-ivory">{it.name}</div>
                <div className="text-xs text-muted">{it.matches} матчів</div>
              </div>
              <span
                className="rating-star h-9 w-9 flex items-center justify-center font-utility text-xs font-bold"
                style={{ background: rc.bg, color: rc.text }}
              >
                {it.avg_rating.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
