type Slot = {
  id: string;
  name: string;
  jersey: number | null;
  x: number;
  y: number;
  rating?: number | null;
  isCaptain?: boolean;
};

function PlayerToken({ slot }: { slot: Slot }) {
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div className="relative w-12 h-12 md:w-16 md:h-16">
        <div className="absolute inset-0 rounded-full bg-panel-raised border-2 border-gold/60" />
        <div
          className="absolute left-0 w-12 md:w-16 flex items-center justify-center bg-panel-raised rounded-t-full rounded-b-lg overflow-hidden"
          style={{ top: "-10px", height: "58px" }}
        >
          <span className="font-display text-sm md:text-lg text-ivory/30">
            {slot.name.split(" ").pop()?.[0]}
          </span>
        </div>
        {slot.jersey != null && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-void border border-gold/60 flex items-center justify-center font-utility text-[8px] md:text-[10px] text-gold-bright">
            {slot.jersey}
          </div>
        )}
        {slot.isCaptain && (
          <div className="absolute -top-1 -left-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-gold-bright text-void flex items-center justify-center font-utility text-[8px] md:text-[10px] font-bold">
            C
          </div>
        )}
      </div>
      <div className="mt-1 text-[10px] md:text-xs text-ivory text-center leading-tight max-w-[64px] md:max-w-[88px] truncate">
        {slot.name}
      </div>
      {slot.rating != null && (
        <div className="rating-star h-5 w-5 md:h-6 md:w-6 flex items-center justify-center font-utility text-[8px] md:text-[9px] font-bold -mt-1">
          {slot.rating.toFixed(1)}
        </div>
      )}
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
  subs: { id: string; name: string; jersey: number | null; inMinute?: number | null; rating?: number | null }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="eyebrow">Тренер</div>
        <div className="font-display text-sm text-ivory">{coach ?? "—"}</div>
      </div>

      <div className="relative w-full aspect-[3/4] md:aspect-[16/9] rounded-xl border border-white/10 bg-panel/60 mb-6">
        {lineup.map((slot) => (
          <PlayerToken key={slot.id} slot={slot} />
        ))}
      </div>

      {subs.length > 0 && (
        <>
          <div className="eyebrow mb-3">Заміни</div>
          <div className="flex flex-wrap gap-4">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-panel-raised border border-gold/40 flex items-center justify-center font-utility text-[10px] text-gold-bright">
                  {s.jersey}
                </div>
                <div>
                  <div className="text-xs text-ivory">{s.name}</div>
                  {s.inMinute != null && (
                    <div className="text-[10px] text-muted">{s.inMinute}&apos;</div>
                  )}
                </div>
                {s.rating != null && (
                  <div className="rating-star h-6 w-6 flex items-center justify-center font-utility text-[9px] font-bold">
                    {s.rating.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
