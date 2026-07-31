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

// Колірна шкала оцінки: низька — червона, висока — зелена
export function ratingColor(rating: number): { bg: string; text: string } {
  if (rating >= 8.5) return { bg: "#2FBF71", text: "#0B2818" };
  if (rating >= 7) return { bg: "#8FCB4A", text: "#17240A" };
  if (rating >= 6) return { bg: "#D4AF37", text: "#17102A" };
  if (rating >= 5) return { bg: "#E08A3C", text: "#2A1608" };
  return { bg: "#DB4B4B", text: "#2A0808" };
}
