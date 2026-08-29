import { shortName, ratingColor } from "@/lib/display";
import { flagUrl } from "@/lib/flags";
import { BallIcon, BootIcon } from "@/components/icons";

type Slot = {
  id: string;
  name: string;
  shortName?: string | null;
  jersey: number | null;
  x?: number;
  y?: number;
  rating?: number | null;
  isLiveRating?: boolean; // ще рахується (голосування триває), не фінальне
  isCaptain?: boolean;
  photoUrl?: string | null;
  photoFocusX?: number | null;
  photoFocusY?: number | null;
  photoZoom?: number | null;
  nationality?: string | null;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  subOutMinute?: number | null;
  subInMinute?: number | null;
  penaltyGoals?: number;
};

function EventIcons({ slot }: { slot: Slot }) {
  const hasAny =
    (slot.goals ?? 0) > 0 ||
    (slot.assists ?? 0) > 0 ||
    (slot.yellowCards ?? 0) > 0 ||
    (slot.redCards ?? 0) > 0 ||
    slot.subOutMinute != null ||
    slot.subInMinute != null;
  if (!hasAny) return null;

  return (
    <div className="flex items-center justify-center gap-0.5 mt-0.5 flex-wrap max-w-[90px]">
      {Array.from({ length: Math.min(slot.goals ?? 0, 4) }).map((_, i) => (
        <BallIcon key={`g${i}`} className="h-3 w-3" />
      ))}
      {(slot.penaltyGoals ?? 0) > 0 && (
        <span className="text-[8px] text-muted leading-none" title="У т.ч. з пенальті">
          (пен. {slot.penaltyGoals})
        </span>
      )}
      {Array.from({ length: Math.min(slot.assists ?? 0, 4) }).map((_, i) => (
        <BootIcon key={`a${i}`} className="h-3 w-3" />
      ))}
      {(slot.yellowCards ?? 0) > 0 && <span className="h-2.5 w-2 bg-yellow-400 rounded-[1px] inline-block" />}
      {(slot.redCards ?? 0) > 0 && <span className="h-2.5 w-2 bg-red-500 rounded-[1px] inline-block" />}
      {slot.subOutMinute != null && (
        <span className="text-[9px] text-red-300 leading-none">↓{slot.subOutMinute}&apos;</span>
      )}
      {slot.subInMinute != null && (
        <span className="text-[9px] text-gold-bright leading-none">↑{slot.subInMinute}&apos;</span>
      )}
    </div>
  );
}

export function TokenVisual({ slot, compact }: { slot: Slot; compact?: boolean }) {
  const label = shortName(slot.name, slot.shortName);
  const sizeClass = compact ? "w-14 h-14 md:w-[4.5rem] md:h-[4.5rem]" : "w-16 h-16 md:w-24 md:h-24";
  const focusX = slot.photoFocusX ?? 50;
  const focusY = slot.photoFocusY ?? 50;
  const zoom = (slot.photoZoom ?? 100) / 100;
  const rc = slot.rating != null ? ratingColor(slot.rating) : null;

  return (
    <div className="flex flex-col items-center">
      {/* Зовнішня обгортка БЕЗ overflow-hidden — інакше бейдж оцінки обрізається */}
      <div className={`relative ${sizeClass}`}>
        {/* Коло — прапор на фоні, фото (якщо є) рівно в межах кола */}
        <div className="absolute inset-0 rounded-full overflow-hidden border-[3px] border-gold bg-panel-raised">
          {slot.nationality && (
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage: `url(${flagUrl(slot.nationality, "svg")})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
          )}
          {slot.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slot.photoUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-lg md:text-2xl text-ivory/70 drop-shadow">{label[0]}</span>
            </div>
          )}
        </div>

        {slot.rating != null && (
          <div
            className={`rating-star absolute -bottom-2 -right-2 h-6 w-6 md:h-8 md:w-8 flex items-center justify-center font-utility text-[9px] md:text-xs font-bold z-20 ${
              slot.isLiveRating ? "opacity-55" : ""
            }`}
            style={rc ? { background: rc.bg, color: rc.text } : undefined}
            title={slot.isLiveRating ? "Поки триває голосування — ще не фінальна оцінка" : undefined}
          >
            {slot.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="mt-1 text-[10px] md:text-sm text-ivory text-center leading-tight whitespace-nowrap">
        {slot.jersey != null && <span className="text-gold-bright/80 font-utility mr-1">{slot.jersey}</span>}
        {label}
      </div>
      <EventIcons slot={slot} />
      {slot.isCaptain && <span className="text-[9px] text-gold-bright">©️ капітан</span>}
    </div>
  );
}

function PitchToken({ slot }: { slot: Slot }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x ?? 50}%`, top: `${slot.y ?? 50}%` }}
    >
      <TokenVisual slot={slot} />
    </div>
  );
}

function StaffCard({
  label,
  name,
  rating,
  photoUrl,
}: {
  label: string;
  name: string | null;
  rating?: number | null;
  photoUrl?: string | null;
}) {
  const rc = rating != null ? ratingColor(rating) : null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-panel px-3 py-2.5 xl:flex-col xl:text-center xl:py-4">
      <div className="h-12 w-12 xl:h-16 xl:w-16 rounded-full overflow-hidden bg-panel-raised shrink-0 relative">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ivory/30 font-display">
            {(name ?? "?")[0]}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="eyebrow mb-0.5">{label}</div>
        <div className="text-sm text-ivory truncate">{name ?? "—"}</div>
        {rating != null && (
          <span
            className="rating-star inline-flex h-6 w-6 items-center justify-center font-utility text-[9px] font-bold mt-1"
            style={rc ? { background: rc.bg, color: rc.text } : undefined}
          >
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FormationPitch({
  coach,
  coachRating,
  coachPhotoUrl,
  referee,
  refereeRating,
  refereePhotoUrl,
  lineup,
  subs,
}: {
  coach: string | null;
  coachRating?: number | null;
  coachPhotoUrl?: string | null;
  referee?: string | null;
  refereeRating?: number | null;
  refereePhotoUrl?: string | null;
  lineup: Slot[];
  subs: Slot[];
}) {
  const subsCompact = subs.length > 6;

  return (
    // На десктопі — тренер/суддя ліворуч, поле по центру, лавка праворуч.
    // Поріг — xl (не lg): при lg сторінці ще замало ширини для 3 колонок,
    // поле стискалось і жетони гравців накладались одне на одне.
    // На телефоні/планшеті лишається типовий порядок зверху вниз.
    <div className="xl:grid xl:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,190px)] xl:gap-6 xl:items-start">
      <div className="flex flex-col gap-3 mb-6 xl:mb-0 xl:order-1">
        <StaffCard label="Тренер" name={coach} rating={coachRating} photoUrl={coachPhotoUrl} />
        {referee && <StaffCard label="Суддя" name={referee} rating={refereeRating} photoUrl={refereePhotoUrl} />}
      </div>

      <div className="xl:order-2">
        {/* Портретна орієнтація, як справжнє поле — не розтягуємо в ширину */}
        <div className="relative w-full max-w-md md:max-w-2xl xl:max-w-none mx-auto aspect-[2/3] rounded-xl border border-white/10 bg-void/70 mb-8 xl:mb-0">
          {lineup.map((slot) => (
            <PitchToken key={slot.id} slot={slot} />
          ))}
        </div>
      </div>

      {subs.length > 0 && (
        <div className="xl:order-3">
          <div className="eyebrow mb-4">Заміни</div>
          <div className="flex flex-wrap xl:flex-col gap-x-6 gap-y-6 xl:gap-4">
            {subs.map((s) => (
              <TokenVisual key={s.id} slot={s} compact={subsCompact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
