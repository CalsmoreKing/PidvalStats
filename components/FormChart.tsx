import { ratingColor } from "@/lib/display";

export default function FormChart({
  points,
}: {
  points: { matchId: string; rating: number; opponentName: string }[];
}) {
  const W = 300;
  const H = 90;
  const PAD_X = 22;
  const PAD_Y = 18;
  const n = points.length;

  function xAt(i: number) {
    if (n <= 1) return W / 2;
    return PAD_X + (i * (W - 2 * PAD_X)) / (n - 1);
  }
  function yAt(rating: number) {
    const clamped = Math.max(0, Math.min(10, rating));
    return PAD_Y + ((10 - clamped) / 10) * (H - 2 * PAD_Y);
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.rating)}`).join(" ");

  return (
    <div className="bg-panel rounded-xl px-2 py-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        {n > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.55}
          />
        )}
        {points.map((p, i) => {
          const rc = ratingColor(p.rating);
          const x = xAt(i);
          const y = yAt(p.rating);
          return (
            <a key={p.matchId} href={`/matches/${p.matchId}`}>
              <title>{`${p.rating.toFixed(1)} — ${p.opponentName}`}</title>
              {/* більше невидиме коло — щоб легше було влучити пальцем на телефоні */}
              <circle cx={x} cy={y} r={10} fill="transparent" />
              <circle cx={x} cy={y} r={4} fill={rc.bg} stroke="#0F0A1C" strokeWidth={1.5} />
              <text
                x={x}
                y={y - 9}
                textAnchor="middle"
                fontSize={8}
                fontWeight={700}
                fill={rc.bg}
                className="font-utility"
              >
                {p.rating.toFixed(1)}
              </text>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
