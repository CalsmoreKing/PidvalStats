import { notFound } from "next/navigation";
import FormationPitch from "@/components/FormationPitch";
import VotingForm, { VotablePlayer } from "@/components/VotingForm";
import VotingCountdown from "@/components/VotingCountdown";
import VotingOpensCountdown from "@/components/VotingOpensCountdown";
import { getMatchById, getLineupForMatch, getMyVotesForMatch } from "@/lib/queries";
import { resolvePitchPositions } from "@/lib/formation";
import { matchStatusLabel } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const match: any = await getMatchById(params.id);
  if (!match) return notFound();

  const lineupRows: any[] = await getLineupForMatch(params.id);

  const starters = lineupRows
    .filter((r) => r.is_starting)
    .map((r) => ({
      id: r.players.id,
      name: r.players.full_name,
      shortName: r.players.short_name,
      jersey: r.players.jersey_number,
      position: r.players.position,
      rating: r.avg_rating,
      isCaptain: r.is_captain,
      photoUrl: r.players.photo_url,
      photoFocusX: r.players.photo_focus_x,
      photoFocusY: r.players.photo_focus_y,
      photoZoom: r.players.photo_zoom,
      nationality: r.players.nationality,
      goals: r.goals,
      assists: r.assists,
      yellowCards: r.yellow_cards,
      redCards: r.red_cards,
      subOutMinute: r.sub_out_minute,
      formationSlot: r.formation_slot,
    }));
  const subs = lineupRows
    .filter((r) => !r.is_starting)
    .map((r) => ({
      id: r.players.id,
      name: r.players.full_name,
      shortName: r.players.short_name,
      jersey: r.players.jersey_number,
      rating: r.avg_rating,
      photoUrl: r.players.photo_url,
      photoFocusX: r.players.photo_focus_x,
      photoFocusY: r.players.photo_focus_y,
      photoZoom: r.players.photo_zoom,
      nationality: r.players.nationality,
      goals: r.goals,
      assists: r.assists,
      yellowCards: r.yellow_cards,
      redCards: r.red_cards,
      subInMinute: r.sub_in_minute,
    }));

  const pitchSlots = resolvePitchPositions(starters);
  const captain = lineupRows.find((r) => r.is_captain);

  const votablePlayers: VotablePlayer[] = lineupRows.map((r) => ({
    playerId: r.players.id,
    name: r.players.full_name,
    jersey: r.players.jersey_number,
    isSub: !r.is_starting,
    photoUrl: r.players.photo_url,
    nationality: r.players.nationality,
    minutesPlayed: r.minutes_played,
    goals: r.goals,
    assists: r.assists,
    funFact: r.fun_fact,
  }));

  const myVotes = match.status === "voting_open" ? await getMyVotesForMatch(match.id) : null;

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl md:max-w-4xl mx-auto">
      <div className="eyebrow mb-3">{match.competitions?.name}</div>
      <h1 className="font-display text-2xl md:text-4xl text-ivory mb-6">
        {match.is_home ? "Барселона" : match.opponent_name} —{" "}
        {match.is_home ? match.opponent_name : "Барселона"}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Стадіон", value: match.venue ?? "—" },
          {
            label: "Рефері",
            value: match.referee
              ? `${match.referee}${match.referee_rating != null ? ` (${match.referee_rating.toFixed(1)})` : ""}`
              : "—",
          },
          { label: "Капітан", value: captain?.players?.full_name ?? "—" },
          {
            label: "Статус",
            value:
              match.status === "voting_open" && match.voting_closes_at ? (
                <span>
                  {matchStatusLabel(match.status)} · <VotingCountdown closesAt={match.voting_closes_at} />
                </span>
              ) : (
                matchStatusLabel(match.status)
              ),
          },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-white/5 bg-panel px-3 py-2">
            <div className="eyebrow mb-1">{row.label}</div>
            <div className="text-ivory text-sm">{row.value}</div>
          </div>
        ))}
      </div>

      {lineupRows.length === 0 ? (
        <p className="text-sm text-muted mb-8">
          Склад ще не внесено — з'явиться тут, коли адмін додасть стартову
          11 і заміни.
        </p>
      ) : (
        <FormationPitch coach={match.coach_name} coachRating={match.coach_rating} lineup={pitchSlots} subs={subs} />
      )}

      {(match.status === "scheduled" || match.status === "live" || match.status === "finished") &&
        match.voting_opens_at && (
          <div className="mt-10">
            <VotingOpensCountdown opensAt={match.voting_opens_at} />
          </div>
        )}

      {match.status === "voting_open" && votablePlayers.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ivory mb-4">Голосування</h2>
          <VotingForm
            matchId={match.id}
            players={votablePlayers}
            coach={match.coach_name ? { name: match.coach_name, photoUrl: match.coaches?.photo_url } : null}
            referee={match.referee ? { name: match.referee, photoUrl: match.referees?.photo_url } : null}
            initialVotes={myVotes}
          />
        </div>
      )}
    </div>
  );
}
