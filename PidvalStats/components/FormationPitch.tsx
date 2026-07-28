import { shortName } from "@/lib/display";

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
        <span key={`g${i}`} className="text-[9px] leading-none">⚽</span>
      ))}
      {Array.from({ length: Math.min(slot.assists ?? 0, 4) }).map((_, i) => (
        <span key={`a${i}`} className="text-[9px] leading-none">👟</span>
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

// Сам "жетон" — коло (завжди чисте) + фото, що виглядає з-над нього, якщо є.
function TokenVisual({ slot, compact }: { slot: Slot; compact?: boolean }) {
  const label = shortName(slot.name, slot.shortName);
  const size = compact ? "w-14 h-14" : "w-16 h-16 md:w-20 md:h-20";

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${size}`}>
        <div className="absolute inset-0 rounded-full bg-panel-raised border-2 border-gold/60 flex items-center justify-center overflow-hidden">
          {!slot.photoUrl && (
            <span className="font-display text-lg md:text-xl text-ivory/25">{label[0]}</span>
          )}
        </div>

        {slot.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.photoUrl}
            alt={label}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[85%] rounded-t-full object-cover"
            style={{ height: "140%", objectPosition: "top" }}
          />
        )}

        {slot.isCaptain && (
          <div className="absolute -top-1 -left-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-gold-bright text-void flex items-center justify-center font-utility text-[8px] md:text-[10px] font-bold z-10">
            C
          </div>
        )}

        {slot.rating != null && (
          <div className="rating-star absolute -bottom-2 -right-2 h-6 w-6 md:h-7 md:w-7 flex items-center justify-center font-utility text-[9px] md:text-[10px] font-bold z-10">
            {slot.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="mt-1 text-[10px] md:text-xs text-ivory text-center leading-tight whitespace-nowrap">
        {slot.jersey != null && <span className="text-gold-bright/80 font-utility mr-1">{slot.jersey}</span>}
        {label}
      </div>
      <EventIcons slot={slot} />
    </div>
  );
}

// На полі — абсолютне позиціювання у %.
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
  lineup,
  subs,
}: {
  coach: string | null;
  lineup: Slot[];
  subs: Slot[];
}) {
  const subsCompact = subs.length > 6;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="eyebrow">Тренер</div>
        <div className="font-display text-sm text-ivory">{coach ?? "—"}</div>
      </div>

      <div className="relative w-full aspect-[3/4] md:aspect-[16/9] rounded-xl border border-white/10 bg-panel/60 mb-8">
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
