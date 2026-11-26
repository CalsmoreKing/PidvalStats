// Спільні правила, за якими «Сезон» рахує оцінку. Одне місце — щоб таблиця,
// головна і профіль гравця не суперечили одне одному.

// Матч із меншою кількістю хвилин не йде в залік оцінки (вихід на 8 хв —
// це шум, а не гра). SQL-двійник: rating_min_minutes() = 25.
export const MIN_MINUTES_FOR_RATING = 25;

// Байєсівське згладжування: (n·mean + k·teamMean) / (n + k).
// Не дає одному матчу з оцінкою 9.5 зробити гравця «топом сезону».
export const BAYES_K = 6;

export function bayesRating(n: number, mean: number, teamMean: number, k = BAYES_K): number | null {
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(mean)) return null;
  return (n * mean + k * teamMean) / (n + k);
}

// Середня оцінка по команді (зважена на кількість матчів) — потрібна для Байєса.
export function teamMean(rows: { matches: number; rating: number | null }[]): number {
  let sum = 0;
  let count = 0;
  for (const r of rows) {
    if (r.rating == null || r.matches <= 0) continue;
    sum += r.rating * r.matches;
    count += r.matches;
  }
  return count > 0 ? sum / count : 6.5;
}

// Куди оцінка матчу потрапляє: чи є похибка через вагу хвилин.
// teamMean 6.5–6.8 типовий, тому віддаємо його явно, щоб було видно в коді.
export const TEAM_MEAN_FALLBACK = 6.5;
