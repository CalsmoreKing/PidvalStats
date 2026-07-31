import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/queries";
import { calcAge } from "@/lib/age";
import { flagUrl } from "@/lib/flags";
import { ratingColor } from "@/lib/display";

export const dynamic = "force-dynamic";

function formatDateUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const profile = await getPlayerProfile(params.id);
  if (!profile) return notFound();

  const { player, season, mvpAwards, history } = profile;
  const age = calcAge(player.birth_date);

  const ratedHistory: any[] = history.filter((h: any) => h.avg_rating != null);
  const last5 = ratedHistory.slice(-5);
  const best = ratedHistory.length
    ? ratedHistory.reduce((a: any, b: any) => (b.avg_rating > a.avg_rating ? b : a))
    : null;
  const worst = ratedHistory.length
    ? ratedHistory.reduce((a: any, b: any) => (b.avg_rating < a.avg_rating ? b : a))
    : null;

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      {/* Заголовок профілю */}
      <div className="relative rounded-2xl overflow-hidden bg-panel border border-white/5 mb-8">
        <div
          className="absolute -inset-6"
          style={{
            backgroundImage: `url(${flagUrl(player.nationality, "svg")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "rotate(-4deg) scale(1.3)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-panel/25 via-panel/70 to-panel/95" aria-hidden />
        <div className="relative flex items-stretch min-h-[160px]">
          <div className="w-[38%] shrink-0 flex items-end justify-center">
            {player.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.full_name}
                className="max-h-full w-auto object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-6">
            {player.jersey_number != null && (
              <div className="font-utility text-sm text-gold-bright/80 mb-1">
                {player.jersey_number}
              </div>
            )}
            <div className="font-display text-2xl text-ivory leading-tight">{player.full_name}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="eyebrow">{player.position}</span>
              <span className="text-xs text-muted">{age} років</span>
            </div>
          </div>
        </div>
        {season?.weighted_season_rating != null && (
          <div
            className="rating-star absolute -bottom-3 -right-3 h-14 w-14 flex items-center justify-center font-utility text-sm font-bold z-10"
            style={{ background: ratingColor(season.weighted_season_rating).bg, color: ratingColor(season.weighted_season_rating).text }}
          >
            {season.weighted_season_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Підсумки сезону */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Матчі", value: season?.matches_rated ?? 0 },
          { label: "Голи", value: season?.total_goals ?? 0 },
          { label: "Асисти", value: season?.total_assists ?? 0 },
          { label: "MVP", value: mvpAwards },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/5 bg-panel px-3 py-3 text-center">
            <div className="font-display text-2xl text-gold-bright">{s.value}</div>
            <div className="eyebrow mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {ratedHistory.length === 0 ? (
        <p className="text-sm text-muted">
          Ще немає оцінених матчів — статистика зʼявиться після першого
          підсумованого голосування.
        </p>
      ) : (
        <>
          {/* Форма — останні 5 матчів */}
          <section className="mb-10">
            <div className="eyebrow mb-3">Форма (останні {last5.length})</div>
            <div className="flex items-end gap-2 h-16">
              {last5.map((h: any, i: number) => {
                const heightPct = Math.max(15, (h.avg_rating / 10) * 100);
                const color =
                  h.avg_rating >= 7.5 ? "bg-gold" : h.avg_rating >= 6 ? "bg-gold/50" : "bg-red-400/60";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${color}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${h.avg_rating.toFixed(1)} — ${h.matches.opponent_name}`}
                    />
                    <span className="text-[9px] text-muted font-utility">{h.avg_rating.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Найкращий / найгірший матч */}
          <section className="grid grid-cols-2 gap-3 mb-10">
            {best && (
              <div className="rounded-lg border border-gold/20 bg-panel px-3 py-3">
                <div className="eyebrow mb-1">Найкращий матч</div>
                <div className="text-sm text-ivory">{best.matches.opponent_name}</div>
                <div className="text-xs text-muted">{formatDateUk(best.matches.match_date)}</div>
              </div>
            )}
            {worst && (
              <div className="rounded-lg border border-white/5 bg-panel px-3 py-3">
                <div className="eyebrow mb-1">Найслабший матч</div>
                <div className="text-sm text-ivory">{worst.matches.opponent_name}</div>
                <div className="text-xs text-muted">{formatDateUk(worst.matches.match_date)}</div>
              </div>
            )}
          </section>

          {/* Історія всіх матчів */}
          <section>
            <div className="eyebrow mb-3">Усі оцінені матчі</div>
            <div className="flex flex-col divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
              {[...ratedHistory].reverse().map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-panel">
                  <div>
                    <div className="text-sm text-ivory">{h.matches.opponent_name}</div>
                    <div className="text-xs text-muted">
                      {formatDateUk(h.matches.match_date)} · {h.matches.competitions?.name}
                    </div>
                  </div>
                  <div
                    className="rating-star h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold"
                    style={{ background: ratingColor(h.avg_rating).bg, color: ratingColor(h.avg_rating).text }}
                  >
                    {h.avg_rating.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
