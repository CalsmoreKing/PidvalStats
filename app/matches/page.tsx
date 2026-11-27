import Link from "next/link";
import { getAllMatches, getFirstTeam } from "@/lib/queries";
import { matchStatusLabel, matchPhase, matchOutcome, ratingColor } from "@/lib/display";
import VotingCountdown from "@/components/VotingCountdown";
import LocalDateTime from "@/components/LocalDateTime";
import MonthAccordion from "@/components/MonthAccordion";

export const revalidate = 30;

// Колір/товщина рамки картки:
//  • майбутній — жовта (найближчий — товста, зі свіченням),
//  • іде зараз — зелена,
//  • завершений — товста за результатом: перемога / нічия / поразка,
//  • скасований — тьмяний.
function cardBorder(m: any, isNext: boolean): string {
  if (m.is_cancelled) return "border border-white/5 bg-panel opacity-50";
  if (m.status === "voting_open") return "border-2 border-gold bg-panel shadow-[0_0_18px_rgba(212,175,55,0.4)]";
  if (m.status === "scheduled") {
    const phase = matchPhase(m.match_date);
    if (phase === "upcoming") {
      return isNext
        ? "border-2 border-yellow-400 bg-panel shadow-[0_0_22px_rgba(250,204,21,0.35)]"
        : "border border-yellow-400/35 bg-panel";
    }
    if (phase !== "over") return "border-2 border-green-400 bg-panel shadow-[0_0_14px_rgba(74,222,128,0.3)]";
  }
  if (m.status === "finalized") {
    const outcome = matchOutcome(m.home_score, m.away_score, m.is_home);
    if (outcome === "win") return "border-2 border-[#2ECC71]/90 bg-panel";
    if (outcome === "draw") return "border-2 border-[#E8C547]/90 bg-panel";
    if (outcome === "loss") return "border-2 border-[#E05A5A]/90 bg-panel";
  }
  return "border border-white/5 bg-panel";
}

function Crest({ src }: { src?: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className="h-5 w-5 shrink-0 object-contain" />
  );
}

function TeamName({ name, crest, right }: { name: string; crest?: string | null; right?: boolean }) {
  return (
    <span
      className={`text-ivory text-sm truncate flex items-center gap-2 ${right ? "justify-end text-right" : "text-left"}`}
    >
      {right && <Crest src={crest} />}
      <span className="truncate">{name}</span>
      {!right && <Crest src={crest} />}
    </span>
  );
}

function MatchCard({ match, isNext, teamCrest }: { match: any; isNext: boolean; teamCrest: string | null }) {
  const score =
    match.home_score != null && match.away_score != null
      ? `${match.home_score}:${match.away_score}`
      : "–:–";
  const homeName = match.is_home ? "Барселона" : match.opponent_name;
  const awayName = match.is_home ? match.opponent_name : "Барселона";
  const rc = match.match_rating != null ? ratingColor(match.match_rating) : null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`relative block rounded-xl px-4 py-4 transition-colors duration-150 hover:brightness-110 ${cardBorder(
        match,
        isNext
      )}`}
    >
      {rc && !match.is_cancelled && (
        <div
          className="rating-star absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center font-utility text-[10px] font-bold"
          style={{ background: rc.bg, color: rc.text }}
        >
          {match.match_rating.toFixed(1)}
        </div>
      )}

      <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${match.is_cancelled ? "line-through" : ""}`}>
        <TeamName name={homeName} crest={match.is_home ? teamCrest : match.opponent_crest_url} right />
        <span className="font-utility text-lg text-gold-bright tracking-wider px-2 whitespace-nowrap">{score}</span>
        <TeamName name={awayName} crest={match.is_home ? match.opponent_crest_url : teamCrest} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted truncate">
          {match.competitions?.name}
          {match.round_number != null && match.competitions?.round_label
            ? ` · ${match.competitions.round_label} ${match.round_number}`
            : ""}{" "}
          · <LocalDateTime iso={match.match_date} mode="datetime" />
        </span>

        {match.is_cancelled ? (
          <span className="text-xs text-red-400 shrink-0">Скасовано</span>
        ) : match.status === "voting_open" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[11px] font-medium text-void shrink-0">
            Голосування
            {match.voting_closes_at && (
              <span className="font-utility text-void/80">
                · <VotingCountdown closesAt={match.voting_closes_at} className="text-void/80" />
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted shrink-0">{matchStatusLabel(match.status, match.match_date)}</span>
        )}
      </div>
    </Link>
  );
}

const MONTHS_NOM = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];
const MONTHS_GEN = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];

// Місяці рахуємо за ISO-ключем, щоб заголовки не залежали від пояса глядача
// (сам час у картці показує LocalDateTime локально).
function monthKey(iso: string) {
  return String(iso).slice(0, 7);
}
function formatMonth(key: string) {
  const [y, mm] = key.split("-");
  return `${MONTHS_NOM[Number(mm) - 1] ?? key} ${y}`;
}
function groupByMonth(list: any[]) {
  const map = new Map<string, any[]>();
  for (const m of list) {
    const key = monthKey(m.match_date);
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return map;
}

// Дата матчу словами: «29 листопада, сб · 22:00» (час локальний)
function MatchDateLine({ iso }: { iso: string }) {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS_GEN[d.getMonth()] ?? "";
  const weekday = d.toLocaleDateString("uk-UA", { weekday: "short" });
  return (
    <span className="text-xs text-muted">
      {day} {month}, {weekday} · <LocalDateTime iso={iso} mode="time" />
    </span>
  );
}

export default async function MatchesPage() {
  const [matchesRaw, team] = await Promise.all([getAllMatches(), getFirstTeam()]);
  const matches = matchesRaw as any[];
  const teamCrest = team?.crest_url ?? null;

  const now = Date.now();
  const isFuture = (m: any) =>
    !m.is_cancelled && m.status === "scheduled" && new Date(m.match_date).getTime() > now;

  const future = matches
    .filter(isFuture)
    .sort((a, b) => +new Date(a.match_date) - +new Date(b.match_date));
  const nextMatch = future[0] ?? null;
  const futureRest = future.slice(1);
  const nextMonth = nextMatch ? monthKey(nextMatch.match_date) : null;

  const played = matches
    .filter((m) => !isFuture(m))
    .sort((a, b) => +new Date(b.match_date) - +new Date(a.match_date));

  const isPlayed = (m: any) => m.status === "finalized" || new Date(m.match_date).getTime() <= now;
  const lastPlayed = played.find(isPlayed) ?? null;
  const playedRest = played.filter((m) => m.id !== lastPlayed?.id);

  // Скільки матчів у кожному майбутньому місяці — для заголовків-груп.
  const futureByMonth = groupByMonth(futureRest);

  return (
    <div className="px-4 md:px-12 py-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-ivory mb-8">Матчі</h1>

      {matches.length === 0 ? (
        <p className="text-sm text-muted">Ще немає жодного матчу.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {/* 1. НАСТУПНИЙ МАТЧ — головна картка сторінки */}
          {nextMatch && (
            <section>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <div className="eyebrow">Наступний матч</div>
                <MatchDateLine iso={nextMatch.match_date} />
              </div>
              <div className="relative">
                <div
                  className="absolute -inset-px rounded-xl bg-gradient-to-br from-yellow-400/30 via-transparent to-transparent blur-[2px]"
                  aria-hidden
                />
                <div className="relative">
                  <MatchCard match={nextMatch} isNext teamCrest={teamCrest} />
                </div>
              </div>
            </section>
          )}

          {/* 2. ЗАПЛАНОВАНІ НА МАЙБУТНЄ — згорнуті по місяцях, місяць наступного відкритий */}
          {futureRest.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <div className="eyebrow">Заплановані</div>
                <span className="text-[11px] text-muted">ще {futureRest.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {Array.from(futureByMonth.entries()).map(([key, list], i) => (
                  <MonthAccordion
                    key={key}
                    label={formatMonth(key)}
                    countLabel={`${list.length} ${list.length === 1 ? "матч" : "матчі"}`}
                    // Відкритий завжди той місяць, у якому найближчий матч;
                    // якщо в ньому більше немає ігор — перший місяць зі списку.
                    defaultOpen={key === nextMonth || i === 0}
                  >
                    {list.map((m: any) => (
                      <MatchCard key={m.id} match={m} isNext={false} teamCrest={teamCrest} />
                    ))}
                  </MonthAccordion>
                ))}
              </div>
            </section>
          )}

          {/* 3. МИНУЛИЙ МАТЧ */}
          {lastPlayed && (
            <section>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <div className="eyebrow">Минулий матч</div>
                <MatchDateLine iso={lastPlayed.match_date} />
              </div>
              <MatchCard match={lastPlayed} isNext={false} teamCrest={teamCrest} />
            </section>
          )}

          {/* 4. РЕШТА ЗІГРАНИХ — по місяцях, найновіші першими */}
          {playedRest.length > 0 && (
            <section>
              <div className="eyebrow mb-3">Зіграні матчі</div>
              <div className="flex flex-col gap-3">
                {Array.from(groupByMonth(playedRest).entries()).map(([key, list]) => (
                  <MonthAccordion
                    key={key}
                    label={formatMonth(key)}
                    countLabel={`${list.length} ${list.length === 1 ? "матч" : "матчі"}`}
                  >
                    {list.map((m: any) => (
                      <MatchCard key={m.id} match={m} isNext={false} teamCrest={teamCrest} />
                    ))}
                  </MonthAccordion>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
