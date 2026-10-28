import AwardVoteForm from "@/components/AwardVoteForm";
import { getAwardData } from "@/lib/queries";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";
import { computeStandings, isSelfVote, votingIsOpen } from "@/lib/award";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const { settings, nominees: all, votes, matchesVoted, totalMatches } = await getAwardData();
  if (!settings) {
    return <div className="px-4 py-16 text-center text-sm text-muted">Нагорода ще не налаштована.</div>;
  }
  const nominees = all.filter((n: any) => n.is_active);
  const open = votingIsOpen(settings);
  const showResults = settings.show_results;

  const standings = computeStandings({
    nominees,
    votes,
    matchesVoted,
    totalMatches,
    settings,
    includeVotes: showResults,
  });

  // Хто зараз заходить: чи може голосувати, за кого не може (за себе)
  const voterId = getVoterIdFromCookie();
  let voter: any = null;
  let myPicks: string[] = [];
  let blockReason: string | null = null;
  let selfIds: string[] = [];
  if (voterId) {
    const supabase = createServiceClient();
    const [{ data: v }, { data: ballot }] = await Promise.all([
      supabase.from("voters").select("id, display_name, custom_display_name, telegram_username, created_at").eq("id", voterId).maybeSingle(),
      supabase.from("award_ballots").select("id, award_picks(place, nominee_id)").eq("voter_id", voterId).maybeSingle(),
    ]);
    voter = v;
    myPicks = ((ballot as any)?.award_picks ?? [])
      .sort((a: any, b: any) => a.place - b.place)
      .map((p: any) => p.nominee_id);
    if (v) {
      const names = [v.display_name, v.custom_display_name, v.telegram_username];
      selfIds = nominees.filter((n: any) => isSelfVote(n, { id: v.id, names })).map((n: any) => n.id);
      if (settings.registered_before && new Date(v.created_at) > new Date(settings.registered_before)) {
        blockReason = "Акаунти, створені після початку нагороди, не голосують.";
      } else if ((matchesVoted[v.id] ?? 0) < settings.min_matches_voted) {
        blockReason = `Щоб голосувати, оціни хоча б ${settings.min_matches_voted} матч(ів) на сайті.`;
      }
    }
  }

  return (
    <div className="px-4 md:px-12 py-10 max-w-5xl mx-auto">
      <div className="eyebrow mb-2">Нагорода каналу</div>
      <h1 className="font-display text-4xl text-ivory mb-2">{settings.title}</h1>
      <p className="text-sm text-muted mb-8 max-w-2xl">
        Найактивніший учасник року. Підсумок складається з базових балів, голосування учасників (1 місце — 5
        балів … 5 місце — 1 бал) і невеликого бонусу за активність на сайті.{" "}
        {open ? (
          <span className="text-gold-bright">Голосування відкрите.</span>
        ) : (
          <span>Голосування {showResults ? "завершено." : "ще не відкрите або вже закрите."}</span>
        )}
      </p>

      {open && (
        <section className="mb-12">
          <h2 className="font-display text-2xl text-ivory mb-4">Твій голос</h2>
          {!voter ? (
            <p className="text-sm text-muted rounded-xl border border-white/5 bg-panel px-4 py-4">
              Щоб проголосувати, увійди через Telegram (кнопка з аватаркою внизу ліворуч). Один акаунт Telegram —
              один голос, тому накрутити його неможливо.
            </p>
          ) : blockReason ? (
            <p className="text-sm text-muted rounded-xl border border-white/5 bg-panel px-4 py-4">{blockReason}</p>
          ) : (
            <AwardVoteForm
              nominees={nominees.map((n: any) => ({ id: n.id, name: n.name }))}
              selfIds={selfIds}
              initialPicks={myPicks}
            />
          )}
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl text-ivory mb-4">{showResults ? "Підсумкова таблиця" : "Номінанти"}</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-panel-raised text-muted eyebrow text-left">
                <th className="px-4 py-3 font-normal">#</th>
                <th className="px-4 py-3 font-normal">Учасник</th>
                <th className="px-4 py-3 font-normal text-right">Базові бали</th>
                <th className="px-4 py-3 font-normal text-right">Активність</th>
                {showResults && <th className="px-4 py-3 font-normal text-right">Голосування</th>}
                {showResults && <th className="px-4 py-3 font-normal text-right">Разом</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(showResults ? standings : [...standings].sort((a, b) => b.basePoints - a.basePoints)).map((s, i) => (
                <tr key={s.nominee.id} className="bg-panel/80">
                  <td className="px-4 py-3 font-display text-gold/50">{i + 1}</td>
                  <td className="px-4 py-3 text-ivory">{s.nominee.name}</td>
                  <td className="px-4 py-3 text-right font-utility text-muted">{s.basePoints.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-utility text-muted">{s.activityScore.toFixed(0)}%</td>
                  {showResults && (
                    <td className="px-4 py-3 text-right font-utility text-muted">
                      {s.votePoints} <span className="text-[10px] text-muted/60">({s.firstPlaces}×1м)</span>
                    </td>
                  )}
                  {showResults && (
                    <td className="px-4 py-3 text-right font-utility text-gold-bright font-bold">{s.total.toFixed(2)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showResults && (
          <p className="text-[11px] text-muted mt-2">
            Результати голосування приховані до закриття, щоб ніхто не підлаштовувався під лідера.
          </p>
        )}
      </section>
    </div>
  );
}
