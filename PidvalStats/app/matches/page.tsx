import Link from "next/link";
import { getAllMatches, getFirstTeam } from "@/lib/queries";
import { matchStatusLabel, matchPhase } from "@/lib/display";
import VotingCountdown from "@/components/VotingCountdown";
import LocalDateTime from "@/components/LocalDateTime";

export const dynamic = "force-dynamic";

function phaseBorder(m: any): string {
  if (m.is_cancelled) return "border-white/5 bg-panel opacity-50";
  if (m.status === "voting_open") {
    return "border-gold bg-panel shadow-[0_0_18px_rgba(212,175,55,0.4)]";
  }
  // "live" як статус ніколи фактично не виставляється (в адмінці немає такої
  // кнопки) — тому підсвічуємо суто за часом: якщо матч ще "scheduled", але
  // орієнтовний час гри вже настав і не сплив, вважаємо його поточним.
  if (m.status === "scheduled") {
    const phase = matchPhase(m.match_date);
    if (phase === "halftime") return "border-yellow-400 bg-panel shadow-[0_0_14px_rgba(250,204,21,0.3)]";
    if (phase !== "over") return "border-green-400 bg-panel shadow-[0_0_14px_rgba(74,222,128,0.3)]";
  }
  return "border-white/5 bg-panel";
}

function isLiveNow(m: any): boolean {
  return !m.is_cancelled && m.status === "scheduled" && matchPhase(m.match_date) !== "over";
}

export default async function MatchesPage() {
  const [matches, team] = await Promise.all([getAllMatches(), getFirstTeam()]);
  let lastMonthKey = "";

  return (
    <div className="px-4 md:px-12 py-8 max-w-4xl mx-auto">
      <div className="eyebrow mb-1">Календар та</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Матчі</h1>

      {matches.length === 0 ? (
        <p className="text-sm text-muted">Ще немає жодного матчу.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m: any) => {
            const monthKey = new Date(m.match_date).toISOString().slice(0, 7);
            const showMonthHeader = monthKey !== lastMonthKey;
            lastMonthKey = monthKey;
            const score =
              m.home_score != null && m.away_score != null ? `${m.home_score}:${m.away_score}` : "–:–";

            return (
              <div key={m.id}>
                {showMonthHeader ? (
                  <div className="font-display text-lg text-gold-bright capitalize mt-4 mb-2 first:mt-0">
                    <LocalDateTime iso={m.match_date} mode="date" />
                  </div>
                ) : (
                  <div className="text-[11px] text-muted/70 mt-1 mb-1 pl-1">
                    <LocalDateTime iso={m.match_date} mode="date" />
                  </div>
                )}

                <Link
                  href={`/matches/${m.id}`}
                  className={`relative block rounded-xl border-2 px-4 py-4 transition-all duration-200 ${phaseBorder(m)}`}
                >
                  {m.match_rating != null && !m.is_cancelled && (
                    <div className="rating-star absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold">
                      {m.match_rating.toFixed(1)}
                    </div>
                  )}
                  {isLiveNow(m) && (
                    <div className="absolute -top-2 -left-2 flex items-center gap-1 rounded-full bg-green-500 text-[9px] font-bold text-void px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-void animate-pulse" />
                      LIVE
                    </div>
                  )}

                  <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${m.is_cancelled ? "line-through" : ""}`}>
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
                    <span className="text-xs text-muted">
                      {m.competitions?.name} · <LocalDateTime iso={m.match_date} mode="time" />
                    </span>

                    {m.is_cancelled ? (
                      <span className="text-xs text-red-400">Скасовано</span>
                    ) : m.status === "voting_open" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[11px] font-medium text-void">
                        Голосування відкрите
                        {m.voting_closes_at && (
                          <span className="font-utility text-void/80">
                            · <VotingCountdown closesAt={m.voting_closes_at} className="text-void/80" />
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">{matchStatusLabel(m.status)}</span>
                    )}
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
