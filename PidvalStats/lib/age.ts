export function calcAge(birthDateIso: string, at: Date = new Date()): number {
  const birth = new Date(birthDateIso);
  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const MONTHS_UK = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];

export function formatBirthDateUk(birthDateIso: string): string {
  const d = new Date(birthDateIso);
  return `${d.getDate()} ${MONTHS_UK[d.getMonth()]} ${d.getFullYear()}`;
}
