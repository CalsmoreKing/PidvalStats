import { calcAge } from "@/lib/age";
import { flagUrl } from "@/lib/flags";

export type PlayerCardData = {
  id: string;
  full_name: string;
  position: string;
  nationality: string;
  birth_date: string; // ISO
  jersey_number: number | null;
  photo_url: string | null; // очікується PNG з прозорим фоном (вирізаний портрет)
  season_rating?: number | null;
};

// Великий банер гравця, ~2:1 — прапор національності на весь банер
// (під делікатним нахилом, теж і під фото), фото-вирізка (PNG, прозорий фон)
// стоїть просто на прапорі, інфо-блок і велика зірка-оцінка справа.
export default function PlayerCard({ player }: { player: PlayerCardData }) {
  const age = calcAge(player.birth_date);

  return (
    <div className="relative aspect-[2/1] rounded-2xl overflow-visible">
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-panel border border-white/5">
        {/* Прапор — на весь банер, під легким нахилом, векторний (без пікселізації) */}
        <div
          className="absolute -inset-6"
          style={{
            backgroundImage: `url(${flagUrl(player.nationality, "svg")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "rotate(-4deg) scale(1.3)",
          }}
          aria-hidden
        />
        {/* Тонування для читабельності тексту справа, зліва прапор лишається виразним */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-panel/25 via-panel/70 to-panel/95"
          aria-hidden
        />

        <div className="relative h-full flex items-stretch">
          {/* Фото-вирізка стоїть на прапорі, знизу банера */}
          <div className="w-[44%] shrink-0 h-full flex items-end justify-center">
            {player.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.full_name}
                className="max-h-full w-auto object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
              />
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
        <div className="absolute top-3 left-3 font-utility text-sm text-gold-bright/80 drop-shadow">
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
