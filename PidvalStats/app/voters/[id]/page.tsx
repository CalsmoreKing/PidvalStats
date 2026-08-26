import { notFound } from "next/navigation";
import Link from "next/link";
import { getVoterProfile, getVoterVoteHistory, getVoterStats } from "@/lib/queries";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { ratingColor } from "@/lib/display";
import VoterMatchRow from "@/components/VoterMatchRow";

export const dynamic = "force-dynamic";

type MatchGroup = {
  matchId: string;
  opponentName: string;
  matchDate: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  ratings: { playerId: string; playerName: string; rating: number; isMvpPick: boolean; isStarting: boolean | null }[];
};

export default async function VoterProfilePage({ params }: { params: { id: string } }) {
  const viewerVoterId = getVoterIdFromCookie();
  const isOwner = viewerVoterId === params.id;

  const [voter, stats] = await Promise.all([getVoterProfile(params.id), getVoterStats(params.id)]);
  if (!voter) return notFound();

  // Приватність: власник профілю завжди бачить свої оцінки, інші — лише
  // якщо фанат сам не вимкнув показ у налаштуваннях.
  const canSeeRatings = isOwner || voter.showRatings !== false;
  const history = canSeeRatings ? await getVoterVoteHistory(params.id) : [];

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
      isStarting: row.is_starting,
    });
    byMatch.set(row.match_id, cur);
  }
  const matches = Array.from(byMatch.values());
  const maxHist = Math.max(1, ...stats.histogram.map((h: any) => h.count));
  const BAR_MAX_PX = 64; // явна висота в px — відсоткова висота ненадійна без фіксованого батька

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      {/* Банер профілю */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-panel mb-10">
        <div className="h-16 bg-gradient-to-r from-gold/25 via-panel-raised to-panel-raised" aria-hidden />
        <div className="px-6 pb-5 -mt-9 flex items-end gap-4 flex-wrap">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-panel bg-panel-raised shrink-0">
            {voter.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={voter.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl text-ivory/40 font-display">
                {(voter.displayName ?? "?")[0]}
              </div>
            )}
          </div>
          <div className="pb-1">
            <div className="eyebrow mb-0.5">Профіль фаната</div>
            <h1 className="font-display text-2xl text-ivory">{voter.displayName}</h1>
          </div>
          {isOwner && (
            <Link
              href="/settings"
              className="ml-auto mb-2 text-xs text-muted hover:text-gold-bright transition-colors duration-150"
            >
              Налаштувати профіль →
            </Link>
          )}
        </div>
      </div>

      {stats.histogram.some((h: any) => h.count > 0) && (
        <section className="mb-10">
          <div className="eyebrow mb-3">Розподіл оцінок</div>
          <div className="flex items-end gap-1.5 bg-panel rounded-xl px-4 pt-3 pb-2">
            {stats.histogram.map((h: any) => (
              <div key={h.score} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted font-utility h-3">{h.count || ""}</span>
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(3, Math.round((h.count / maxHist) * BAR_MAX_PX))}px`,
                    background: ratingColor(h.score).bg,
                    opacity: h.count > 0 ? 1 : 0.12,
                  }}
                />
                <span className="text-[9px] text-muted font-utility">{h.score}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(stats.top.length > 0 || stats.bottom.length > 0) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {stats.top.length > 0 && <FavList title="Кому ставить найвище" items={stats.top} />}
          {stats.bottom.length > 0 && <FavList title="Кому ставить найнижче" items={stats.bottom} />}
        </section>
      )}

      <section>
        <div className="eyebrow mb-3">Оцінки за матчі</div>
        {!canSeeRatings ? (
          <p className="text-sm text-muted">Цей фанат вирішив не показувати свої оцінки іншим.</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted">
            Ще немає голосів по завершених матчах — з'являться тут одразу після підрахунку.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((m) => (
              <VoterMatchRow key={m.matchId} {...m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FavList({ title, items }: { title: string; items: any[] }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((p: any) => {
          const rc = ratingColor(p.myAverage);
          return (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center justify-between rounded-lg bg-panel px-3 py-2 hover:bg-panel-raised transition-colors duration-150"
            >
              <span className="text-sm text-ivory truncate">{p.full_name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted font-utility">{p.voteCount}×</span>
                <span
                  className="rating-star h-7 w-7 flex items-center justify-center font-utility text-[10px] font-bold"
                  style={{ background: rc.bg, color: rc.text }}
                >
                  {p.myAverage.toFixed(1)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
