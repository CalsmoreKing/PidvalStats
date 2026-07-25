import Link from "next/link";
import { mockMatches, MockMatch } from "@/lib/mockData";

function statusLabel(status: MockMatch["status"]) {
  switch (status) {
    case "scheduled":
      return { text: "Заплановано", color: "text-muted" };
    case "live":
      return { text: "Наживо", color: "text-gold-bright animate-pulse" };
    case "finished":
      return { text: "Матч завершено", color: "text-muted" };
    case "voting_open":
      return { text: "Голосування відкрите", color: "text-gold-bright" };
    case "finalized":
      return { text: "Підсумовано", color: "text-muted" };
  }
}

function monthLabelUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}
function dayLabelUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

export default function MatchesPage() {
  const sorted = [...mockMatches].sort((a, b) => b.date.localeCompare(a.date));
  let lastMonth = "";

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      <div className="eyebrow mb-1">Календар та</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Матчі</h1>

      <div className="flex flex-col gap-3">
        {sorted.map((m) => {
          const month = monthLabelUk(m.date);
          const showMonthHeader = month !== lastMonth;
          lastMonth = month;
          const status = statusLabel(m.status);
          const score =
            m.homeScore != null && m.awayScore != null
              ? `${m.homeScore}:${m.awayScore}`
              : "–:–";

          return (
            <div key={m.id}>
              {showMonthHeader ? (
                <div className="font-display text-lg text-gold-bright capitalize mt-4 mb-2 first:mt-0">
                  {month}
                </div>
              ) : (
                <div className="text-[11px] text-muted/70 mt-1 mb-1 pl-1">
                  {dayLabelUk(m.date)}
                </div>
              )}

              <Link
                href={`/matches/${m.id}`}
                className="relative block rounded-xl border border-white/5 bg-panel px-4 py-4"
              >
                {m.avgRating != null && (
                  <div className="rating-star absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold">
                    {m.avgRating.toFixed(1)}
                  </div>
                )}

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span className="text-ivory text-sm text-right truncate">
                    {m.isHome ? "Барселона" : m.opponent}
                  </span>
                  <span className="font-utility text-lg text-gold-bright tracking-wider px-2 whitespace-nowrap">
                    {score}
                  </span>
                  <span className="text-ivory text-sm text-left truncate">
                    {m.isHome ? m.opponent : "Барселона"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted">{m.competition}</span>
                  <span className={`text-xs ${status.color}`}>{status.text}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
