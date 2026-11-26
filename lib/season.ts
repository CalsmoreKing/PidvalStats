// Спільні правила, за якими «Сезон» рахує оцінку. Одне місце — щоб таблиця,
// головна і профіль гравця не суперечили одне одному.

// Матч із меншою кількістю хвилин не йде в залік оцінки (вихід на 8 хв —
// це шум, а не гра). SQL-двійник: rating_min_minutes() = 25.
export const MIN_MINUTES_FOR_RATING = 25;

// Мінімум «залікових» матчів, щоб оцінка брала участь у рейтингу взагалі.
// Раніше замість цього стояло байєсівське згладжування (k=6), яке тягнуло
// будь-який одиничний матч до середнього по команді — через це резервний
// воротар з одним матчем опинявся вище півоснови. Тепер оцінка = чесне
// середнє зі своїх матчів, а в топ потрапляють лише ті, хто реально грав.
export const MIN_MATCHES_FOR_RANK = 3;

// Поріг для місця в рейтингу: і за хвилинами, і за матчами.
export const MIN_MINUTES_FOR_RANK = 270;

export function qualifiesForRank(matches: number, minutes: number): boolean {
  return matches >= MIN_MATCHES_FOR_RANK && minutes >= MIN_MINUTES_FOR_RANK;
}

// Середнє, зважене на хвилини: матч на 90 хв важить більше, ніж вихід на 25.
export function weightedMean(weightedSum: number, minutesSum: number): number | null {
  if (!Number.isFinite(weightedSum) || !Number.isFinite(minutesSum) || minutesSum <= 0) return null;
  return weightedSum / minutesSum;
}
