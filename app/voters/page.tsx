import Link from "next/link";
import { getVotersDetailed } from "@/lib/queries";
import { ratingColor, pluralMatches } from "@/lib/display";

export const revalidate = 120;

function avatar(url: string | null, name: string | null, size: string) {
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
  const totalMvp = voters.reduce((s, v) => s + v.mvp_matches, 0);
  const avgAll =
    voters.length > 0
      ? voters.reduce((s, v) => s + (v.avg_rating_given ?? 0), 0) /
        voters.filter((v) => v.avg_rating_given != null).length
      : null;
  const leaders = [...voters].sort((a, b) => b.matches_voted - a.matches_voted).slice(0, 3);
  const strict = [...voters]
    .filter((v) => v.matches_voted >= 3 && v.avg_rating_given != null)
    .sort((a, b) => (a.avg_rating_given ?? 0) - (b.avg_rating_given ?? 0))
    .slice(0, 3);
  const generous = [...voters]
    .filter((v) => v.matches_voted >= 3 && v.avg_rating_given != null)
    .sort((a, b) => (b.avg_rating_given ?? 0) - (a.avg_rating_given ?? 0))
    .slice(0, 3);

  return (
    <div className="px-4 md:px-12 py-8 max-w-4xl mx-auto">
      <div className="eyebrow mb-1">Спільнота</div>
      <h1 className="font-display text-3xl text-ivory mb-2">Фанати</h1>
      <p className="text-sm text-muted mb-8">
        {voters.length} {voters.length === 1 ? "фанат оцінює" : "фанатів оцінюють"} матчі сезону ·
        разом {totalRatings.toLocaleString("uk-UA")} оцінок · {totalMvp} виборів МВП
        {avgAll != null && Number.isFinite(avgAll) ? ` · середня оцінка спільноти ${avgAll.toFixed(2)}` : ""}
      </p>

      {voters.length === 0 ? (
        <p className="text-sm text-muted">Ще ніхто не проголосував по завершених матчах.</p>
      ) : (
        <>
          {/* П'єдестал за кількістю матчів */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {leaders.map((v, i) => (
              <Link
                key={v.voter_id}
                href={`/voters/${v.voter_id}`}
                className="relative rounded-xl border border-white/5 bg-panel/70 px-4 py-4 flex items-center gap-3 hover:border-gold/30 transition-colors duration-150"
              >
                <span className="absolute top-2 right-3 font-display text-2xl text-gold/25">#{i + 1}</span>
                {avatar(v.avatar_url, v.display_name, "h-11 w-11")}
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

          {/* Хто як оцінює: суворий / щедрий */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <TasteBlock title="Найсуворіші" items={strict} />
            <TasteBlock title="Найщедріші" items={generous} />
          </div>

          <div className="eyebrow mb-3">Усі фанати</div>
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
                    {avatar(v.avatar_url, v.display_name, "h-9 w-9")}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ivory truncate">{v.display_name}</div>
                      <div className="text-[11px] text-muted truncate">
                        {pluralMatches(v.matches_voted)} · {v.total_ratings_given} оцінок
                        {v.mvp_matches > 0 && ` · ${v.mvp_matches}× МВП`}
                      </div>
                    </div>
                    {rc && (
                      <div
                        className="rating-star h-8 w-8 shrink-0 flex items-center justify-center font-utility text-[10px] font-bold"
                        style={{ background: rc.bg, color: rc.text }}
                        title="Середня оцінка, яку ставить цей фанат"
                      >
                        {v.avg_rating_given!.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Смуга покриття сезону — скільки матчів із завершених оцінив */}
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

function TasteBlock({
  title,
  items,
}: {
  title: string;
  items: { voter_id: string; display_name: string | null; avatar_url: string | null; avg_rating_given: number | null; matches_voted: number }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/5 bg-panel/50 px-4 py-3">
      <div className="eyebrow mb-2">{title}</div>
      <div className="flex flex-col gap-1.5">
        {items.map((v) => {
          const rc = ratingColor(v.avg_rating_given ?? 5);
          return (
            <Link
              key={v.voter_id}
              href={`/voters/${v.voter_id}`}
              className="flex items-center gap-2 text-xs text-ivory hover:text-gold-bright transition-colors duration-150"
            >
              {avatar(v.avatar_url, v.display_name, "h-6 w-6")}
              <span className="flex-1 truncate">{v.display_name}</span>
              <span className="text-[10px] text-muted font-utility">{v.matches_voted} м.</span>
              <span
                className="rating-star h-6 w-6 flex items-center justify-center font-utility text-[9px] font-bold"
                style={{ background: rc.bg, color: rc.text }}
              >
                {(v.avg_rating_given ?? 0).toFixed(1)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
