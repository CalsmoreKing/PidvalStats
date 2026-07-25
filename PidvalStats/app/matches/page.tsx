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

function formatDateUk(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });
}

export default function MatchesPage() {
  return (
    <div className="px-6 md:px-12 py-10 max-w-4xl mx-auto">
      <div className="eyebrow mb-3">Календар</div>
      <h1 className="font-display text-4xl text-ivory mb-10">Матчі</h1>

      <div className="flex flex-col gap-10">
        {mockMatches.map((m) => {
          const status = statusLabel(m.status);
          const score =
            m.homeScore != null && m.awayScore != null
              ? `${m.homeScore} : ${m.awayScore}`
              : "– : –";
          return (
            <div key={m.id}>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-display text-lg text-gold-bright whitespace-nowrap">
                  {formatDateUk(m.date)}
                </span>
                <div className="hairline flex-1" />
              </div>

              <Link
                href={`/matches/${m.id}`}
                className="block rounded-xl border border-white/5 bg-panel hover:border-gold/30 transition-colors px-6 py-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-panel-raised flex items-center justify-center font-utility text-xs text-muted">
                      FCB
                    </div>
                    <span className="text-ivory">
                      {m.isHome ? "Барселона" : m.opponent}
                    </span>
                  </div>

                  <div className="font-utility text-2xl text-gold-bright tracking-wider">
                    {score}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-ivory">
                      {m.isHome ? m.opponent : "Барселона"}
                    </span>
                    <div className="h-10 w-10 rounded-full bg-panel-raised flex items-center justify-center font-utility text-xs text-muted">
                      {m.opponent.slice(0, 3).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
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
