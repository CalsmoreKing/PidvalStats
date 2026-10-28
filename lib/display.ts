// Коротке ім'я для схеми складу: якщо адмін вписав short_name вручну —
// беремо його; інакше автоматично беремо останнє слово повного імені
// (спрацьовує для більшості імен; складені прізвища на кшталт
// "тер Штеген", "де Йонг" — краще вписати вручну через адмінку).
export function shortName(fullName: string, override?: string | null): string {
  if (override && override.trim()) return override.trim();
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

// Спільний переклад статусів матчу для інтерфейсу
export const MATCH_STATUS_LABELS: Record<string, string> = {
  scheduled: "Заплановано",
  live: "Наживо",
  finished: "Матч завершено",
  voting_open: "Голосування відкрите",
  finalized: "Підсумовано",
};

const PHASE_LABELS: Record<string, string> = {
  "first-half": "Наживо · 1-й тайм",
  halftime: "Наживо · перерва",
  "second-half": "Наживо · 2-й тайм",
};

// matchDateIso — необов'язковий: якщо переданий і статус досі "scheduled",
// показуємо реальну фазу гри (1-й тайм / перерва / 2-й тайм) замість
// статичного "Заплановано", яке інакше висіло б увесь матч — статусу
// "live" в адмінці ніхто не виставляє вручну.
export function matchStatusLabel(status: string, matchDateIso?: string): string {
  if (status === "scheduled" && matchDateIso) {
    const phase = matchPhase(matchDateIso);
    if (phase !== "upcoming" && phase !== "over") return PHASE_LABELS[phase] ?? MATCH_STATUS_LABELS[status];
  }
  return MATCH_STATUS_LABELS[status] ?? status;
}

// Правильне українське закінчення для числівника + "матч"
export function pluralMatches(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} матч`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} матчі`;
  return `${n} матчів`;
}

// Орієнтовна фаза матчу, поки він "live" — рахуємо просто від часу кікоффа,
// бо не ведемо окремого "поточна хвилина" вручну.
export function matchPhase(
  matchDateIso: string
): "upcoming" | "first-half" | "halftime" | "second-half" | "over" {
  const elapsedMin = (Date.now() - new Date(matchDateIso).getTime()) / 60_000;
  if (elapsedMin < 0) return "upcoming"; // матч ще не почався (навіть якщо це завтра чи пізніше)
  if (elapsedMin < 45) return "first-half";
  if (elapsedMin < 60) return "halftime";
  // до 130 (не 115) — запас на затримки й додатковий час, щоб зелене
  // підсвічування не зникало, поки матч фактично ще триває
  if (elapsedMin < 130) return "second-half";
  return "over";
}
export function ratingColor(rating: number): { bg: string; text: string } {
  // Раніше 7.0-8.4 і 8.5-10 обидва були відтінками зелено-жовтого й майже
  // не різнились візуально. Тепер кожен рівень — виразно інший колір.
  if (rating >= 9) return { bg: "#1FAE6B", text: "#07200F" }; // насичений смарагд
  if (rating >= 8) return { bg: "#4FBF5A", text: "#0C2410" }; // трав'яний зелений
  if (rating >= 7) return { bg: "#9ED13A", text: "#1B2408" }; // лаймовий
  if (rating >= 6) return { bg: "#D4AF37", text: "#17102A" }; // золотий
  if (rating >= 5) return { bg: "#E08A3C", text: "#2A1608" }; // оранжевий
  return { bg: "#DB4B4B", text: "#2A0808" }; // червоний
}
