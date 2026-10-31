import GoldBall from "./GoldBall";

export default function AwardHero({
  title,
  status,
  note,
}: {
  title: string;
  status: "open" | "results" | "waiting";
  note?: string;
}) {
  const chip =
    status === "open"
      ? "Голосування відкрите"
      : status === "results"
      ? "Переможця визначено"
      : "Голосування ще не відкрите";
  return (
    <header className="gold-stage gold-frame relative overflow-hidden rounded-3xl px-5 pt-10 pb-9 md:pt-14 md:pb-12 text-center">
      <GoldBall className="mx-auto h-28 w-28 md:h-40 md:w-40" />
      <h1 className="gold-text font-display font-black text-5xl sm:text-6xl md:text-8xl leading-[1.05] mt-6 md:mt-8 pb-1">
        {title}
      </h1>
      <div className="gold-rule mx-auto my-5 md:my-6 max-w-sm" />
      <p className="font-display text-lg md:text-2xl text-champagne">Найактивніший учасник чату</p>
      <p className="text-xs md:text-sm text-muted mt-1">26 жовтня 2025 — 26 жовтня 2026</p>
      <div
        className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs md:text-sm border ${
          status === "waiting"
            ? "border-white/15 text-muted"
            : "border-gold/60 bg-gold/10 text-gold-bright shadow-[0_0_24px_rgba(212,175,55,0.25)]"
        }`}
      >
        {status !== "waiting" && <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" />}
        {chip}
        {note && <span className="text-muted">· {note}</span>}
      </div>
    </header>
  );
}
