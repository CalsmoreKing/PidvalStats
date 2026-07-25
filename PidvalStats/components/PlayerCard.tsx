import { calcAge } from "@/lib/age";
import { flagUrl } from "@/lib/flags";

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

// Великий банер гравця, ~2:1 (90×45) — фото зліва на весь зріст банера,
// прапор національності тьмяно на фоні, інфо-блок справа,
// велика зірка-оцінка виступає за нижній правий кут.
export default function PlayerCard({ player }: { player: PlayerCardData }) {
  const age = calcAge(player.birth_date);

  return (
    <div className="relative aspect-[2/1] rounded-2xl overflow-visible">
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-panel border border-white/5">
        {/* Прапор — тьмяний фон на всю картку */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-110"
          style={{ backgroundImage: `url(${flagUrl(player.nationality)})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-panel/10 via-panel/70 to-panel" aria-hidden />

        <div className="relative h-full flex items-stretch">
          {/* Фото на весь зріст банера */}
          <div className="w-[42%] shrink-0 h-full bg-panel-raised flex items-end justify-center overflow-hidden">
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.full_name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <span className="font-display text-4xl text-ivory/10 pb-2">
                {player.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            )}
          </div>

          {/* Інфо-блок */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
            <div className="font-display text-lg md:text-xl text-ivory leading-tight truncate">
              {player.full_name}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="eyebrow">{player.position}</span>
              <span className="text-xs text-muted">{age} років</span>
            </div>
          </div>
        </div>
      </div>

      {player.jersey_number != null && (
        <div className="absolute top-3 left-3 font-utility text-sm text-gold-bright/80">
          {player.jersey_number}
        </div>
      )}

      {player.season_rating != null && (
        <div className="rating-star absolute -bottom-3 -right-3 h-14 w-14 flex items-center justify-center font-utility text-sm font-bold z-10">
          {player.season_rating.toFixed(1)}
        </div>
      )}
    </div>
  );
}
