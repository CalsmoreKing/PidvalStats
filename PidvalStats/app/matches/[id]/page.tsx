import { mockMatches, mockCoach, mockLineup, mockSubs } from "@/lib/mockData";
import { notFound } from "next/navigation";
import FormationPitch from "@/components/FormationPitch";
import VotingForm, { VotablePlayer } from "@/components/VotingForm";

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const match = mockMatches.find((m) => m.id === params.id);
  if (!match) return notFound();

  const votablePlayers: VotablePlayer[] = [
    ...mockLineup.map((s) => ({ playerId: s.playerId, name: s.name, jersey: s.jersey })),
    ...mockSubs.map((s) => ({ playerId: s.playerId, name: s.name, jersey: s.jersey, isSub: true })),
  ];

  return (
    <div className="px-4 md:px-12 py-8 max-w-2xl mx-auto">
      <div className="eyebrow mb-3">{match.competition}</div>
      <h1 className="font-display text-2xl md:text-4xl text-ivory mb-6">
        {match.isHome ? "Барселона" : match.opponent} —{" "}
        {match.isHome ? match.opponent : "Барселона"}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Стадіон", value: "—" },
          { label: "Рефері", value: "—" },
          { label: "Капітан", value: "—" },
          { label: "Статус", value: match.status },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-white/5 bg-panel px-3 py-2">
            <div className="eyebrow mb-1">{row.label}</div>
            <div className="text-ivory text-sm">{row.value}</div>
          </div>
        ))}
      </div>

      <FormationPitch coach={mockCoach} lineup={mockLineup} subs={mockSubs} />

      {match.status === "voting_open" && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ivory mb-1">Голосування</h2>
          <p className="text-xs text-muted mb-4">
            Онови всім гравцям оцінку 1–10 і, за бажанням, обери MVP — голос
            зараховується одним пакетом, коли натиснеш «Надіслати».
          </p>
          <VotingForm matchId={match.id} players={votablePlayers} />
        </div>
      )}
    </div>
  );
}
