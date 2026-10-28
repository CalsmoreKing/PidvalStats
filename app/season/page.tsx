import SeasonTable, { MatchRow } from "@/components/SeasonTable";
import RatingList from "@/components/RatingList";
import {
  getSeasonPlayerMatches,
  getCompetitions,
  getSeasonRefereeRatings,
  getSeasonCoachRatings,
  getFirstTeam,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const [raw, competitions, refereeRatings, coachRatings, team] = await Promise.all([
    getSeasonPlayerMatches(),
    getCompetitions(),
    getSeasonRefereeRatings(),
    getSeasonCoachRatings(),
    getFirstTeam(),
  ]);

  // Лише гравці основної команди (як і раніше в season_stats)
  const rows: MatchRow[] = raw
    .filter((r: any) => !team || r.team_id === team.id)
    .map((r: any) => ({
      id: r.player_id,
      fullName: r.full_name,
      position: r.position,
      competitionSlug: r.competition_slug,
      month: String(r.match_date).slice(0, 7),
      isStarting: !!r.is_starting,
      minutes: Number(r.minutes_played ?? 0),
      goals: Number(r.goals ?? 0),
      penaltyGoals: Number(r.penalty_goals ?? 0),
      assists: Number(r.assists ?? 0),
      votes: Number(r.votes ?? 0),
      rating: r.avg_rating != null ? Number(r.avg_rating) : null,
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
        <SeasonTable rows={rows} competitions={competitions} />
      )}

      {(coachRatings.length > 0 || refereeRatings.length > 0) && (
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 items-start">
          {coachRatings.length > 0 && (
            <div>
              <h2 className="font-display text-2xl text-ivory mb-4">Оцінки тренера</h2>
              <RatingList items={coachRatings as any[]} />
            </div>
          )}
          {refereeRatings.length > 0 && (
            <div>
              <h2 className="font-display text-2xl text-ivory mb-4">Оцінки рефері</h2>
              <RatingList items={refereeRatings as any[]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
