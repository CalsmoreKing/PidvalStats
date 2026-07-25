import { mockMatches } from "@/lib/mockData";
import { notFound } from "next/navigation";

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const match = mockMatches.find((m) => m.id === params.id);
  if (!match) return notFound();

  return (
    <div className="px-6 md:px-12 py-10 max-w-4xl mx-auto">
      <div className="eyebrow mb-3">{match.competition}</div>
      <h1 className="font-display text-3xl md:text-4xl text-ivory mb-8">
        {match.isHome ? "Барселона" : match.opponent} —{" "}
        {match.isHome ? match.opponent : "Барселона"}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Стадіон", value: "—" },
          { label: "Рефері", value: "—" },
          { label: "Капітан", value: "—" },
          { label: "Статус", value: match.status },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-white/5 bg-panel px-4 py-3">
            <div className="eyebrow mb-1">{row.label}</div>
            <div className="text-ivory text-sm">{row.value}</div>
          </div>
        ))}
      </div>

      <div className="hairline mb-8" />

      <p className="text-muted text-sm">
        Стартовий склад, заміни, голи, картки та результати голосування
        зʼявляться тут після того, як адмін внесе склад і відкриє
        голосування.
      </p>

      {/* TODO: коли матч у статусі 'voting_open' — рендерити список гравців
          зі стартового складу + заміни, кожен зі слайдером 1–10, і
          POST на /api/votes. Поки голосування не завершене — оцінки
          нікому не показуються, включно з адміном. */}
    </div>
  );
}
