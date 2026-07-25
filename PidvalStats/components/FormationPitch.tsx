import { LineupSlot } from "@/lib/mockData";

function PlayerToken({ slot }: { slot: LineupSlot }) {
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div className="relative w-12 h-12">
        {/* Кільце-підложка — сама "коло"-форма */}
        <div className="absolute inset-0 rounded-full bg-panel-raised border-2 border-gold/60" />
        {/* Портрет — вищий за кільце, верхня частина виходить над ним */}
        <div
          className="absolute left-0 w-12 flex items-center justify-center bg-panel-raised rounded-t-full rounded-b-lg overflow-hidden"
          style={{ top: "-10px", height: "58px" }}
        >
          <span className="font-display text-sm text-ivory/30">
            {slot.name.split(" ").pop()?.[0]}
          </span>
        </div>
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-void border border-gold/60 flex items-center justify-center font-utility text-[8px] text-gold-bright">
          {slot.jersey}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-ivory text-center leading-tight max-w-[64px] truncate">
        {slot.name}
      </div>
      {slot.rating != null && (
        <div className="rating-star h-5 w-5 flex items-center justify-center font-utility text-[8px] font-bold -mt-1">
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
  coach: { name: string };
  lineup: LineupSlot[];
  subs: { playerId: string; name: string; jersey: number; inMinute: number; rating?: number }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="eyebrow">Тренер</div>
        <div className="font-display text-sm text-ivory">{coach.name}</div>
      </div>

      <div className="relative w-full aspect-[3/4] rounded-xl border border-white/10 bg-panel/60 mb-6">
        {lineup.map((slot) => (
          <PlayerToken key={slot.playerId} slot={slot} />
        ))}
      </div>

      <div className="eyebrow mb-3">Заміни</div>
      <div className="flex flex-wrap gap-4">
        {subs.map((s) => (
          <div key={s.playerId} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-panel-raised border border-gold/40 flex items-center justify-center font-utility text-[10px] text-gold-bright">
              {s.jersey}
            </div>
            <div>
              <div className="text-xs text-ivory">{s.name}</div>
              <div className="text-[10px] text-muted">{s.inMinute}&apos;</div>
            </div>
            {s.rating != null && (
              <div className="rating-star h-6 w-6 flex items-center justify-center font-utility text-[9px] font-bold">
                {s.rating.toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
