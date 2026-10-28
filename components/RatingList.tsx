import { ratingColor } from "@/lib/display";

// avg_rating = null, якщо за цього суддю/тренера ще ніхто не голосував
type Item = { name: string; matches: number; avg_rating: number | null };

// Список «ім'я + кількість матчів + оцінка-зірка» — для тренерів і суддів
// (і на головній, і в «Сезоні»).
export default function RatingList({ items, compact = false }: { items: Item[]; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <div className="flex flex-col divide-y divide-white/5">
        {items.map((it) => {
          const rc = it.avg_rating != null ? ratingColor(Number(it.avg_rating)) : null;
          return (
            <div
              key={it.name}
              className={`flex items-center justify-between gap-3 px-4 bg-panel/80 ${compact ? "py-2" : "py-3"}`}
            >
              <div className="min-w-0">
                <div className="text-sm text-ivory truncate">{it.name}</div>
                <div className="text-xs text-muted">{matchesWord(it.matches)}</div>
              </div>
              {rc ? (
                <span
                  className={`rating-star shrink-0 flex items-center justify-center font-utility text-xs font-bold ${
                    compact ? "h-8 w-8" : "h-9 w-9"
                  }`}
                  style={{ background: rc.bg, color: rc.text }}
                >
                  {Number(it.avg_rating).toFixed(1)}
                </span>
              ) : (
                <span
                  className="shrink-0 text-xs text-muted/60 font-utility px-2"
                  title="Ще немає оцінок від фанатів"
                >
                  —
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function matchesWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} матч`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} матчі`;
  return `${n} матчів`;
}
