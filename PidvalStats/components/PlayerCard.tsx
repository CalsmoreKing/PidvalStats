import { calcAge, formatBirthDateUk } from "@/lib/age";
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

export default function PlayerCard({ player }: { player: PlayerCardData }) {
  const age = calcAge(player.birth_date);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-panel">
      {/* Прапор національності — тьмяний фон під портретом */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center scale-125 blur-[1px] group-hover:opacity-25 transition-opacity"
        style={{ backgroundImage: `url(${flagUrl(player.nationality)})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/70 to-panel/10" aria-hidden />

      {/* Портрет */}
      <div className="relative aspect-[3/4] flex items-end justify-center">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.full_name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="font-display text-6xl text-ivory/15">
              {player.full_name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        )}
      </div>

      {/* Номер гравця — верхній лівий кут */}
      {player.jersey_number != null && (
        <div className="absolute top-3 left-3 font-utility text-2xl text-gold-bright/90">
          {player.jersey_number}
        </div>
      )}

      {/* Позначка позиції */}
      <div className="absolute top-3 right-3 eyebrow bg-void/60 px-2 py-1 rounded">
        {player.position}
      </div>

      {/* Медаль-печатка з оцінкою за сезон */}
      {player.season_rating != null && (
        <div className="ticket-edge medal-seal absolute -bottom-1 right-4 h-14 w-14 rounded-full flex items-center justify-center font-display text-xl font-semibold">
          {player.season_rating.toFixed(1)}
        </div>
      )}

      {/* Інфо-блок */}
      <div className="relative px-4 pb-4 pt-2">
        <div className="font-display text-lg text-ivory leading-tight">
          {player.full_name}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm text-muted">{age} років</span>
          <span className="text-[10px] text-muted/60 font-utility">
            {formatBirthDateUk(player.birth_date)}
          </span>
        </div>
      </div>
    </div>
  );
}
