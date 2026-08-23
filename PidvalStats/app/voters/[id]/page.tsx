import { notFound } from "next/navigation";
import Link from "next/link";
import { getVoterProfile, getVoterVoteHistory } from "@/lib/queries";
import { ratingColor } from "@/lib/display";
import LocalDateTime from "@/components/LocalDateTime";

export const dynamic = "force-dynamic";

type MatchGroup = {
  matchId: string;
  opponentName: string;
  matchDate: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  ratings: { playerId: string; playerName: string; rating: number; isMvpPick: boolean }[];
};

export default async function VoterProfilePage({ params }: { params: { id: string } }) {
  const [voter, history] = await Promise.all([
    getVoterProfile(params.id),
    getVoterVoteHistory(params.id),
  ]);

  if (!voter) return notFound();

  // Групуємо пласку історію голосів по матчу — один блок на матч,
  // всередині всі оцінки, які саме цей фанат поставив.
  const byMatch = new Map<string, MatchGroup>();
  for (const row of history as any[]) {
    const cur =
      byMatch.get(row.match_id) ??
      ({
        matchId: row.match_id,
        opponentName: row.opponent_name,
        matchDate: row.match_date,
        isHome: row.is_home,
        homeScore: row.home_score,
        awayScore: row.away_score,
        ratings: [],
      } as MatchGroup);
    cur.ratings.push({
      playerId: row.player_id,
      playerName: row.player_name,
      rating: row.rating,
      isMvpPick: row.is_mvp_pick,
    });
    byMatch.set(row.match_id, cur);
  }
  const matches = Array.from(byMatch.values());

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-14 w-14 rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center">
          {voter.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={voter.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg text-ivory/60">{(voter.displayName ?? "?")[0]}</span>
          )}
        </div>
        <div>
          <div className="eyebrow mb-1">Профіль фаната</div>
          <h1 className="font-display text-2xl text-ivory">{voter.displayName}</h1>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted">
          Ще немає голосів по завершених матчах — з'являться тут одразу після підрахунку.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((m) => (
            <div key={m.matchId} className="rounded-xl border border-white/5 overflow-hidden">
              <Link
                href={`/matches/${m.matchId}`}
                className="flex items-center justify-between px-5 py-3 bg-panel-raised hover:bg-panel-raised/70 transition-colors duration-150"
              >
                <div>
                  <div className="text-sm text-ivory">
                    {m.isHome ? "Барселона" : m.opponentName} — {m.isHome ? m.opponentName : "Барселона"}
                  </div>
                  <div className="text-xs text-muted">
                    <LocalDateTime iso={m.matchDate} mode="date" />
                  </div>
                </div>
                {m.homeScore != null && m.awayScore != null && (
                  <div className="font-utility text-ivory">
                    {m.homeScore}:{m.awayScore}
                  </div>
                )}
              </Link>
              <div className="flex flex-col divide-y divide-white/5">
                {m.ratings.map((r) => {
                  const rc = ratingColor(r.rating);
                  return (
                    <Link
                      key={r.playerId}
                      href={`/players/${r.playerId}`}
                      className="flex items-center justify-between px-5 py-2.5 bg-panel/60 hover:bg-panel transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2 text-sm text-ivory">
                        {r.playerName}
                        {r.isMvpPick && <span className="eyebrow text-gold-bright">MVP</span>}
                      </div>
                      <span
                        className="rating-star h-8 w-8 flex items-center justify-center font-utility text-[11px] font-bold"
                        style={{ background: rc.bg, color: rc.text }}
                      >
                        {r.rating}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
