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
            className="rating-star absolute -bottom-2 -right-2 h-6 w-6 md:h-8 md:w-8 flex items-center justify-center font-utility text-[9px] md:text-xs font-bold z-20"
            style={rc ? { background: rc.bg, color: rc.text } : undefined}
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

export default function FormationPitch({
  coach,
  coachRating,
  lineup,
  subs,
}: {
  coach: string | null;
  coachRating?: number | null;
  lineup: Slot[];
  subs: Slot[];
}) {
  const cRc = coachRating != null ? ratingColor(coachRating) : null;
  const subsCompact = subs.length > 6;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="eyebrow">Тренер</div>
        <div className="font-display text-sm text-ivory">{coach ?? "—"}</div>
        {coachRating != null && (
          <span
            className="rating-star h-6 w-6 flex items-center justify-center font-utility text-[9px] font-bold"
            style={cRc ? { background: cRc.bg, color: cRc.text } : undefined}
          >
            {coachRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Портретна орієнтація, як справжнє поле — не розтягуємо в ширину */}
      <div className="relative w-full max-w-md md:max-w-2xl mx-auto aspect-[2/3] rounded-xl border border-white/10 bg-void/70 mb-8">
        {lineup.map((slot) => (
          <PitchToken key={slot.id} slot={slot} />
        ))}
      </div>

      {subs.length > 0 && (
        <>
          <div className="eyebrow mb-4">Заміни</div>
          <div className="flex flex-wrap gap-x-6 gap-y-6">
            {subs.map((s) => (
              <TokenVisual key={s.id} slot={s} compact={subsCompact} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
