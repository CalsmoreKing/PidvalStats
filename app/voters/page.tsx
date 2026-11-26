import Link from "next/link";
import { getVotersDetailed } from "@/lib/queries";
import { ratingColor, pluralMatches } from "@/lib/display";

export const revalidate = 120;

function Avatar({ url, name, size }: { url: string | null; name: string | null; size: string }) {
  return (
    <div className={`${size} rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs text-ivory/60">{(name ?? "?")[0]}</span>
      )}
    </div>
  );
}

export default async function VotersPage() {
  const { voters, totalMatches } = await getVotersDetailed();

  const totalRatings = voters.reduce((s, v) => s + Number(v.total_ratings_given ?? 0), 0);
  const withAvg = voters.filter((v) => v.avg_rating_given != null);
  const avgAll = withAvg.length > 0 ? withAvg.reduce((s, v) => s + (v.avg_rating_given ?? 0), 0) / withAvg.length : null;
  const bestCoverage = voters.reduce((max, v) => (v.coverage > max ? v.coverage : max), 0);
  const leaders = [...voters].sort((a, b) => b.matches_voted - a.matches_voted).slice(0, 3);

  return (
    <div className="px-4 md:px-12 py-8 max-w-4xl mx-auto">
      <div className="eyebrow mb-1">Спільнота</div>
      <h1 className="font-display text-3xl text-ivory mb-6">Фанати</h1>

      {/* Підсумки спільноти */}
      <div className="rounded-2xl border border-white/5 bg-panel/60 p-5 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat value={voters.length} label="фанатів" />
          <Stat value={totalRatings.toLocaleString("uk-UA")} label="оцінок" />
          <Stat value={totalMatches} label="матчів сезону" />
          <Stat value={avgAll != null ? avgAll.toFixed(2) : "—"} label="середня оцінка" />
        </div>
        <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold/40 to-gold-bright"
            style={{ width: `${Math.min(100, bestCoverage)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span>найактивніший фанат відвідав {bestCoverage}% матчів сезону</span>
          <span>{voters.length > 0 ? `${voters.filter((v) => v.coverage >= 100).length} з повним покриттям` : ""}</span>
        </div>
      </div>

      {voters.length === 0 ? (
        <p className="text-sm text-muted">Ще ніхто не проголосував по завершених матчах.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {leaders.map((v, i) => (
              <Link
                key={v.voter_id}
                href={`/voters/${v.voter_id}`}
                className="relative rounded-xl border border-white/5 bg-panel/70 px-4 py-4 flex items-center gap-3 hover:border-gold/30 transition-colors duration-150"
              >
                <span className="absolute top-2 right-3 font-display text-2xl text-gold/25">#{i + 1}</span>
                <Avatar url={v.avatar_url} name={v.display_name} size="h-11 w-11" />
                <div className="min-w-0">
                  <div className="text-sm text-ivory truncate">{v.display_name}</div>
                  <div className="text-[11px] text-muted">
                    {pluralMatches(v.matches_voted)}
                    {totalMatches > 0 && <span className="text-gold/70"> · {v.coverage}% сезону</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {voters.map((v, i) => {
              const rc = v.avg_rating_given != null ? ratingColor(v.avg_rating_given) : null;
              return (
                <Link
                  key={v.voter_id}
                  href={`/voters/${v.voter_id}`}
                  className="rounded-xl border border-white/5 bg-panel/70 px-4 py-3 hover:border-gold/25 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-gold/40 w-6 shrink-0 text-center text-sm">{i + 1}</span>
                    <Avatar url={v.avatar_url} name={v.display_name} size="h-9 w-9" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ivory truncate">{v.display_name}</div>
                      <div className="text-[11px] text-muted truncate">
                        {pluralMatches(v.matches_voted)} · {v.total_ratings_given} оцінок
                      </div>
                    </div>
                    {rc && (
                      <div
                        className="rating-star h-8 w-8 shrink-0 flex items-center justify-center font-utility text-[10px] font-bold"
                        style={{ background: rc.bg, color: rc.text }}
                      >
                        {v.avg_rating_given!.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold/40 to-gold-bright"
                        style={{ width: `${Math.min(100, v.coverage)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-utility text-muted shrink-0 w-8 text-right">{v.coverage}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl md:text-3xl text-gold-bright leading-none">{value}</div>
      <div className="text-[11px] text-muted mt-1">{label}</div>
    </div>
  );
}
