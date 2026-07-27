export const NATIONALITY_TO_ISO: Record<string, string> = {
  "Іспанія": "es",
  "Угорщина": "hu",
  "Німеччина": "de",
  "Польща": "pl",
  "Уругвай": "uy",
  "Данія": "dk",
  "Франція": "fr",
  "Нідерланди": "nl",
  "Англія": "gb-eng",
  "Бразилія": "br",
  "Швеція": "se",
  "Гана": "gh",
  "Еквадор": "ec",
  "Аргентина": "ar",
  "Хорватія": "hr",
  "Малі": "ml",
  "Єгипет": "eg",
};

export function flagUrl(
  nationality: string,
  format: 80 | 160 | 320 | "svg" = 160
) {
  const code = NATIONALITY_TO_ISO[nationality] ?? "un";
  if (format === "svg") {
    return `https://flagcdn.com/${code}.svg`;
  }
  return `https://flagcdn.com/w${format}/${code}.png`;
}
