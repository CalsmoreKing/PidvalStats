import PlayerCard, { PlayerCardData } from "@/components/PlayerCard";
import RatingList from "@/components/RatingList";
import {
  getTopPlayers,
  getBottomPlayers,
  getTopMatches,
  getVoterActivity,
  getSeasonCoachRatings,
  getSeasonRefereeRatings,
} from "@/lib/queries";
import { ratingColor } from "@/lib/display";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Фіксовані розміри топів на головній
const TOP_MATCHES = 4;
const TOP_VOTERS = 5;
const TOP_REFEREES = 5;

export default async function CampNouPage() {
  const [topPlayersRaw, bottomPlayersRaw, topMatches, topVotersAll, coachRatings, refereeRatings] =
    await Promise.all([
      getTopPlayers(3),
      getBottomPlayers(3),
      getTopMatches(TOP_MATCHES),
      getVoterActivity(),
      getSeasonCoachRatings(),
      getSeasonRefereeRatings(),
    ]);
  const topVoters = topVotersAll.slice(0, TOP_VOTERS);

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
    <div className="px-4 md:px-6 xl:px-8 py-6 max-w-[1500px] mx-auto">
      <h1 className="font-display text-2xl xl:text-3xl text-ivory mb-5">Барселона</h1>

      {/* Десктоп (xl) — 4 колонки В ОДИН РЯД, без «шахівниці»:
          [фанати + тренери] [Топ‑3] [Дно‑3] [матчі + судді]. Кожна колонка —
          окремий вертикальний стек, тож жодна не чекає на висоту сусідньої.
          Вужче (md) — два стовпці: гравці зверху, решта під ними. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1fr)] gap-x-6 xl:gap-x-8 gap-y-8 items-start">
        {/* ЛІВА колонка */}
        <div className="flex flex-col gap-6 order-3 xl:order-1">
          {topVoters.length > 0 && (
            <section>
              <SectionTitle title="Топ‑5 фанатів" href="/voters" />
              <div className="flex flex-col rounded-xl border border-white/5 bg-panel/60 overflow-hidden divide-y divide-white/5">
                {topVoters.map((v: any) => {
                  const avg = v.avg_rating_given != null ? Number(v.avg_rating_given) : null;
                  const rc = avg != null ? ratingColor(avg) : null;
                  return (
                    <Link
                      key={v.voter_id}
                      href={`/voters/${v.voter_id}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-panel-raised transition-colors duration-150"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center">
                        {v.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-ivory/60">{(v.display_name ?? "?")[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ivory truncate leading-tight">{v.display_name}</div>
                        <div className="text-[11px] text-muted leading-tight">
                          {v.matches_voted} {v.matches_voted === 1 ? "матч" : "матчів"}
                          {avg != null && <span className="text-muted/70"> · сер. оцінка</span>}
                        </div>
                      </div>
                      {avg != null && rc && (
                        <span
                          className="rating-star shrink-0 h-8 w-8 flex items-center justify-center font-utility text-[11px] font-bold"
                          style={{ background: rc.bg, color: rc.text }}
                          title="Середня оцінка, яку фанат ставить гравцям"
                        >
                          {avg.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {coachRatings.length > 0 && (
            <section>
              <SectionTitle title={coachRatings.length > 1 ? "Рейтинг тренерів" : "Рейтинг тренера"} href="/season" />
              <RatingList items={coachRatings as any[]} compact />
            </section>
          )}
        </div>

        {/* ЦЕНТР 1 — Топ‑3 */}
        <section className="order-1 xl:order-2">
          <SectionTitle title="Топ‑3 гравці сезону" />
          {topPlayers.length === 0 ? (
            <p className="text-sm text-muted">
              Ще немає завершених матчів з оцінками — статистика зʼявиться тут після першого підсумованого
              голосування.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {topPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}
        </section>

        {/* ЦЕНТР 2 — Дно‑3 (окремий стек, починається на одному рівні з Топ‑3) */}
        <section className="order-2 xl:order-3">
          <SectionTitle title="Дно‑3 сезону" />
          {bottomPlayers.length === 0 ? (
            <p className="text-sm text-muted">З&apos;явиться, коли гравці матимуть щонайменше 2 оцінені матчі.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {bottomPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}
        </section>

        {/* ПРАВА колонка */}
        <div className="flex flex-col gap-6 order-4">
          <section>
            <SectionTitle title={`Топ‑${TOP_MATCHES} матчів сезону`} href="/matches" linkLabel="Усі матчі →" />
            {topMatches.length === 0 ? (
              <p className="text-sm text-muted">Ще немає підсумованих матчів.</p>
            ) : (
              <div className="flex flex-col rounded-xl border border-white/5 bg-panel/60 overflow-hidden divide-y divide-white/5">
                {topMatches.map((m: any) => {
                  const round =
                    m.round_number != null && m.competitions?.round_label
                      ? ` · ${m.competitions.round_label} ${m.round_number}`
                      : "";
                  const rc = m.match_rating != null ? ratingColor(m.match_rating) : null;
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-panel-raised transition-colors duration-150"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-ivory truncate leading-tight">
                          {m.is_home ? "Барселона" : m.opponent_name} — {m.is_home ? m.opponent_name : "Барселона"}
                        </div>
                        <div className="text-[11px] text-muted leading-tight truncate">
                          {m.competitions?.name}
                          {round}
                        </div>
                      </div>
                      <div
                        className="rating-star shrink-0 h-8 w-8 flex items-center justify-center font-utility text-[11px] font-bold"
                        style={rc ? { background: rc.bg, color: rc.text } : undefined}
                      >
                        {m.match_rating?.toFixed(1)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {refereeRatings.length > 0 && (
            <section>
              <SectionTitle title="Рейтинг суддів" href="/season" />
              <RatingList items={(refereeRatings as any[]).slice(0, TOP_REFEREES)} compact />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, href, linkLabel = "Усі →" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="font-display text-lg xl:text-xl text-ivory">{title}</h2>
      {href && (
        <Link href={href} className="text-xs text-muted hover:text-gold-bright transition-colors duration-150">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
