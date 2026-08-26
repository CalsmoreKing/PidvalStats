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

export function matchStatusLabel(status: string): string {
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
  if (elapsedMin < 115) return "second-half";
  return "over";
}
export function ratingColor(rating: number): { bg: string; text: string } {
  if (rating >= 8.5) return { bg: "#2FBF71", text: "#0B2818" };
  if (rating >= 7) return { bg: "#8FCB4A", text: "#17240A" };
  if (rating >= 6) return { bg: "#D4AF37", text: "#17102A" };
  if (rating >= 5) return { bg: "#E08A3C", text: "#2A1608" };
  return { bg: "#DB4B4B", text: "#2A0808" };
}
