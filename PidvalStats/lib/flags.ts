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

export function flagUrl(nationality: string, width: 80 | 160 | 320 = 160) {
  const code = NATIONALITY_TO_ISO[nationality] ?? "un";
  return `https://flagcdn.com/w${width}/${code}.png`;
}
