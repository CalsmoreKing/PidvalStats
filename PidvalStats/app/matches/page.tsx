import Link from "next/link";
import { getAllMatches, getFirstTeam } from "@/lib/queries";
import { matchStatusLabel } from "@/lib/display";
import VotingCountdown from "@/components/VotingCountdown";

export const dynamic = "force-dynamic";

function statusColor(status: string) {
  switch (status) {
    case "live":
      return "text-gold-bright animate-pulse";
    case "voting_open":
      return "text-gold-bright";
    default:
      return "text-muted";
  }
}

function monthLabelUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}
function dayLabelUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

export default async function MatchesPage() {
  const [matches, team] = await Promise.all([getAllMatches(), getFirstTeam()]);
  let lastMonth = "";

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      <div className="eyebrow mb-1">Календар та</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Матчі</h1>

      {matches.length === 0 ? (
        <p className="text-sm text-muted">
          Ще немає жодного матчу — додай перший через адмін-панель (/admin).
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m: any) => {
            const month = monthLabelUk(m.match_date);
            const showMonthHeader = month !== lastMonth;
            lastMonth = month;
            const score =
              m.home_score != null && m.away_score != null
                ? `${m.home_score}:${m.away_score}`
                : "–:–";

            return (
              <div key={m.id}>
                {showMonthHeader ? (
                  <div className="font-display text-lg text-gold-bright capitalize mt-4 mb-2 first:mt-0">
                    {month}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted/70 mt-1 mb-1 pl-1">
                    {dayLabelUk(m.match_date)}
                  </div>
                )}

                <Link
                  href={`/matches/${m.id}`}
                  className="relative block rounded-xl border border-white/5 bg-panel px-4 py-4"
                >
                  {m.coach_rating != null && (
                    <div className="rating-star absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold">
                      {m.coach_rating.toFixed(1)}
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <span className="text-ivory text-sm text-right truncate flex items-center justify-end gap-2">
                      {m.is_home ? "Барселона" : m.opponent_name}
                      {(m.is_home ? team?.crest_url : m.opponent_crest_url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.is_home ? team!.crest_url! : m.opponent_crest_url}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      )}
                    </span>
                    <span className="font-utility text-lg text-gold-bright tracking-wider px-2 whitespace-nowrap">
                      {score}
                    </span>
                    <span className="text-ivory text-sm text-left truncate flex items-center gap-2">
                      {(!m.is_home ? team?.crest_url : m.opponent_crest_url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={!m.is_home ? team!.crest_url! : m.opponent_crest_url}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      )}
                      {m.is_home ? m.opponent_name : "Барселона"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted">{m.competitions?.name}</span>
                    <span className={`text-xs ${statusColor(m.status)}`}>
                      {matchStatusLabel(m.status)}
                      {m.status === "voting_open" && m.voting_closes_at && (
                        <>
                          {" · "}
                          <VotingCountdown closesAt={m.voting_closes_at} />
                        </>
                      )}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
