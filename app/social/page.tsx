import AwardVoteForm from "@/components/AwardVoteForm";
import AwardHero from "@/components/award/Hero";
import AwardRules from "@/components/award/Rules";
import NomineeTable from "@/components/award/NomineeTable";
import AwardResults from "@/components/award/Results";
import SpecialNominations from "@/components/award/Special";
import { getAwardData } from "@/lib/queries";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";
import { computeStandings, isSelfVote, votingIsOpen } from "@/lib/award";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const { settings, nominees: all, votes, matchesVoted, totalMatches, special } = await getAwardData();
  if (!settings) {
    return <div className="px-4 py-16 text-center text-sm text-muted">Нагорода ще не налаштована.</div>;
  }
  const nominees = all.filter((n: any) => n.is_active);
  const open = votingIsOpen(settings);
  const showResults = !!settings.show_results;

  // Підсумок рахуємо лише коли його вже можна показувати — до того голоси
  // навіть не потрапляють у сторінку.
  const standings = showResults
    ? computeStandings({ nominees, votes, matchesVoted, totalMatches, settings, includeVotes: true })
    : [];
  const wSum = Number(settings.weight_base) + Number(settings.weight_votes) + Number(settings.weight_activity) || 1;
  const w = (x: number) => Number(x) / wSum;

  // Хто заходить: чи може голосувати, за кого не може (за себе)
  const voterId = getVoterIdFromCookie();
  let voter: any = null;
  let myPicks: string[] = [];
  let blockReason: string | null = null;
  let selfIds: string[] = [];
  if (voterId && open) {
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

  const closes = settings.closes_at
    ? `до ${new Date(settings.closes_at).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" })}`
    : undefined;

  return (
    <div className="px-4 md:px-8 xl:px-12 py-6 md:py-10 max-w-5xl mx-auto flex flex-col gap-12 md:gap-16">
      <AwardHero title={settings.title} status={showResults ? "results" : open ? "open" : "waiting"} note={open ? closes : undefined} />

      {showResults && (
        <AwardResults
          standings={standings}
          totalMatches={totalMatches}
          wb={w(settings.weight_base)}
          wv={w(settings.weight_votes)}
          wa={w(settings.weight_activity)}
        />
      )}

      {open && (
        <section>
          <h2 className="font-display text-2xl md:text-3xl text-champagne mb-4 text-center">Твій голос</h2>
          {!voter ? (
            <p className="text-sm text-muted gold-frame rounded-2xl px-5 py-5 text-center">
              Щоб проголосувати, увійди через Telegram — кнопка з аватаркою внизу ліворуч. Один акаунт Telegram — один голос.
            </p>
          ) : blockReason ? (
            <p className="text-sm text-muted gold-frame rounded-2xl px-5 py-5 text-center">{blockReason}</p>
          ) : (
            <AwardVoteForm
              nominees={nominees.map((n: any) => ({ id: n.id, name: n.name }))}
              selfIds={selfIds}
              initialPicks={myPicks}
            />
          )}
        </section>
      )}

      <AwardRules settings={settings} />

      <section>
        <h2 className="font-display text-2xl md:text-3xl text-champagne mb-1 text-center">Номінанти</h2>
        <p className="text-sm text-muted text-center mb-5">30 найактивніших за статистикою чату</p>
        <NomineeTable
          nominees={nominees}
          totalMatches={totalMatches}
          siteDone={Object.fromEntries(nominees.map((n: any) => [n.id, n.voter_id ? matchesVoted[n.voter_id] ?? 0 : null]))}
        />
      </section>

      <SpecialNominations items={special} />
    </div>
  );
}
