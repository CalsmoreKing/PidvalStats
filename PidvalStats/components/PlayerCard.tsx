import { calcAge } from "@/lib/age";

export type PlayerCardData = {
  id: string;
  full_name: string;
  position: string;
  nationality: string;
  birth_date: string; // ISO
  jersey_number: number | null;
  photo_url: string | null;
  season_rating?: number | null;
};

// Горизонтальний компактний банер гравця — фото зліва, текст справа,
// зірка-оцінка виступає за нижній правий кут банера.
export default function PlayerCard({ player }: { player: PlayerCardData }) {
  const age = calcAge(player.birth_date);

  return (
    <div className="relative flex items-center gap-3 rounded-xl bg-panel border border-white/5 pr-4 overflow-visible">
      <div className="h-14 w-14 shrink-0 rounded-l-xl overflow-hidden bg-panel-raised flex items-center justify-center">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.full_name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="font-display text-lg text-ivory/20">
            {player.full_name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
      </div>

      <div className="min-w-0 py-2">
        <div className="font-display text-sm text-ivory truncate">
          {player.full_name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="eyebrow">{player.position}</span>
          <span className="text-[11px] text-muted">{age} р.</span>
        </div>
      </div>

      {player.season_rating != null && (
        <div className="rating-star absolute -bottom-2 -right-2 h-9 w-9 flex items-center justify-center font-utility text-[11px] font-bold">
          {player.season_rating.toFixed(1)}
        </div>
      )}
    </div>
  );
}
