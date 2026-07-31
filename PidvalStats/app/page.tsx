import PlayerCard, { PlayerCardData } from "@/components/PlayerCard";
import { getTopPlayers, getTopMatches } from "@/lib/queries";
import { ratingColor } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function CampNouPage() {
  const [topPlayersRaw, topMatches] = await Promise.all([
    getTopPlayers(3),
    getTopMatches(3),
  ]);

  const topPlayers: PlayerCardData[] = topPlayersRaw.map((p: any) => ({
    id: p.player_id,
    full_name: p.full_name,
    position: p.position,
    nationality: p.nationality,
    birth_date: p.birth_date,
    jersey_number: p.jersey_number,
    photo_url: p.photo_url,
    season_rating: p.weighted_season_rating,
  }));

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-ivory mb-8">Барселона</h1>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-ivory">Топ‑3 гравці сезону</h2>
        </div>
        {topPlayers.length === 0 ? (
          <p className="text-sm text-muted">
            Ще немає завершених матчів з оцінками — статистика зʼявиться тут
            після першого підсумованого голосування.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {topPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-ivory">Топ‑3 матчі сезону</h2>
        </div>
        {topMatches.length === 0 ? (
          <p className="text-sm text-muted">Ще немає підсумованих матчів.</p>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-panel/60 overflow-hidden">
            {topMatches.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm text-ivory">
                    {m.is_home ? "Барселона" : m.opponent_name} —{" "}
                    {m.is_home ? m.opponent_name : "Барселона"}
                  </div>
                  <div className="text-xs text-muted">{m.competitions?.name}</div>
                </div>
                <div
                  className="rating-star h-9 w-9 flex items-center justify-center font-utility text-[11px] font-bold"
                  style={m.coach_rating != null ? { background: ratingColor(m.coach_rating).bg, color: ratingColor(m.coach_rating).text } : undefined}
                >
                  {m.coach_rating?.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
