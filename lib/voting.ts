// Тривалість голосування — одне місце на весь код (SQL-двійник: функція
// voting_duration() у міграції 031).
//
// Чому саме 24 години: голосування відкривається через 90 хв після старту
// й триває добу — і ранній, і пізній матч охоплюють «наступний ранок» та
// «наступний вечір», а підсумки не затягуються. Довше (48 год) гальмувало б
// підсумки й давало б голосувати «заднім числом» під впливом обговорень.
export const VOTING_HOURS = 24;
export const VOTING_MS = VOTING_HOURS * 3600_000;

export function votingClosesAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + VOTING_MS);
}

/** «3 год 05 хв» / «12 хв» — для підписів, де секунди не потрібні */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} год ${m.toString().padStart(2, "0")} хв` : `${m} хв`;
}
