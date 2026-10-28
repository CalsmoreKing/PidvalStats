// Рахує "12:00 наступного дня за годинником Варшави/Мадрида" (той самий
// пояс, що й у клубу — Іспанія і Польща в одній зоні CET/CEST) — без
// зовнішніх date-бібліотек, лише вбудований Intl, тому коректно враховує
// перехід на літній/зимовий час сам.
export function nextDayNoonInTimezone(fromDate: Date, timeZone = "Europe/Warsaw"): Date {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fromDate);
  const y = Number(dateParts.find((p) => p.type === "year")!.value);
  const m = Number(dateParts.find((p) => p.type === "month")!.value);
  const d = Number(dateParts.find((p) => p.type === "day")!.value);

  // Припущення: "наступний день 12:00" в UTC, без урахування зсуву поясу
  const guess = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));

  // Дивимось, яка це насправді ГОДИНА за годинником Варшави в момент guess,
  // і коригуємо різницю (CET/CEST завжди рівна кількість годин, без хвилин)
  const localHourAtGuess = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hour12: false }).format(guess)
  );
  const diffHours = 12 - localHourAtGuess;
  return new Date(guess.getTime() + diffHours * 3600_000);
}
