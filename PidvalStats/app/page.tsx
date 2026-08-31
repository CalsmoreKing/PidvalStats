import PlayerCard, { PlayerCardData } from "@/components/PlayerCard";
import { getTopPlayers, getBottomPlayers, getTopMatches, getVoterActivity } from "@/lib/queries";
import { ratingColor } from "@/lib/display";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CampNouPage() {
  const [topPlayersRaw, bottomPlayersRaw, topMatches, topVotersAll] = await Promise.all([
    getTopPlayers(3),
    getBottomPlayers(3),
    getTopMatches(5),
    getVoterActivity(),
  ]);
  const topVoters = topVotersAll.slice(0, 5);

  const mapPlayer = (p: any): PlayerCardData => ({
    id: p.player_id,
    full_name: p.full_name,
    position: p.position,
    nationality: p.nationality,
    birth_date: p.birth_date,
    jersey_number: p.jersey_number,
    photo_url: p.photo_url,
    season_rating: p.weighted_season_rating,
  });
  const topPlayers: PlayerCardData[] = topPlayersRaw.map(mapPlayer);
  const bottomPlayers: PlayerCardData[] = bottomPlayersRaw.map(mapPlayer);

  return (
    <div className="px-4 md:px-12 py-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl text-ivory mb-8">Барселона</h1>

      {/* На десктопі — дві колонки поруч. Праворуч одразу і фанати, і
          матчі, один під одним — щоб закрити порожнє місце під коротким
          списком матчів, а не лишати його висіти в повітрі. */}
      <div className="md:grid md:grid-cols-2 md:gap-10 md:items-start">
        <section>
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

        {bottomPlayers.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-xl text-ivory">Дно‑3 сезону</h2>
            </div>
            <div className="flex flex-col gap-6">
              {bottomPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-10 mt-10 md:mt-0">
          {topVoters.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-xl text-ivory">Топ‑5 фанатів</h2>
                <Link href="/voters" className="text-xs text-muted hover:text-gold-bright transition-colors duration-150">
                  Усі →
                </Link>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-panel/60 overflow-hidden">
                {topVoters.map((v: any) => (
                  <Link
                    key={v.voter_id}
                    href={`/voters/${v.voter_id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-panel-raised transition-colors duration-150"
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center">
                      {v.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-ivory/60">{(v.display_name ?? "?")[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ivory truncate">{v.display_name}</div>
                      <div className="text-xs text-muted">
                        {v.matches_voted} {v.matches_voted === 1 ? "матч" : "матчів"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-xl text-ivory">Топ‑5 матчів сезону</h2>
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
                      style={m.match_rating != null ? { background: ratingColor(m.match_rating).bg, color: ratingColor(m.match_rating).text } : undefined}
                    >
                      {m.match_rating?.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
