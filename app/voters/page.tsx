import Link from "next/link";
import { getVoterActivity } from "@/lib/queries";
import { ratingColor } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function VotersPage() {
  const voters = await getVoterActivity();

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      <div className="eyebrow mb-1">Спільнота</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Фанати</h1>

      {voters.length === 0 ? (
        <p className="text-sm text-muted">Ще ніхто не проголосував по завершених матчах.</p>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="flex flex-col divide-y divide-white/5">
            {voters.map((v: any, i: number) => (
              <Link
                key={v.voter_id}
                href={`/voters/${v.voter_id}`}
                className="flex items-center gap-3 px-5 py-3 bg-panel/80 hover:bg-panel-raised transition-colors duration-150"
              >
                <span className="font-display text-gold/50 w-6 shrink-0 text-center">{i + 1}</span>
                <div className="h-9 w-9 rounded-full overflow-hidden bg-panel-raised shrink-0 flex items-center justify-center">
                  {v.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-ivory/60">{(v.display_name ?? "?")[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ivory truncate">{v.display_name}</div>
                  <div className="text-xs text-muted">
                    {v.matches_voted} {v.matches_voted === 1 ? "матч" : "матчів"} проголосовано
                  </div>
                </div>
                {v.avg_rating_given != null && (
                  <div
                    className="rating-star h-8 w-8 shrink-0 flex items-center justify-center font-utility text-[10px] font-bold"
                    style={{ background: ratingColor(v.avg_rating_given).bg, color: ratingColor(v.avg_rating_given).text }}
                    title="Середня оцінка, яку ставить цей фанат"
                  >
                    {v.avg_rating_given.toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
