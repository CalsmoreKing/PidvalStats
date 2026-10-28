// Єдине джерело правди для позицій гравця — рівно ці 10 кодів, без винятків.
// Використовується у формі ручного додавання гравця (RosterManager), щоб
// не можна було вписати довільний текст замість коду позиції.
export const POSITIONS = [
  "ВРТ",
  "ЦЗ",
  "ЛЗ",
  "ПЗ",
  "ЦОП",
  "ЦП",
  "ЦАП",
  "ЛВ",
  "ПВ",
  "ФРВ",
] as const;

export type Position = (typeof POSITIONS)[number];

// Чотири лінії поля — для фільтра в «Сезоні» і для порядку гравців у
// голосуванні (від воротаря до нападників). Колір — той самий, що в
// овальному фільтрі: ВРТ червоний, ЗАХ жовтий, ПЗХ зелений, НАП синій.
export type PositionGroup = "ВРТ" | "ЗАХ" | "ПЗХ" | "НАП";

export const POSITION_GROUPS: {
  key: PositionGroup;
  label: string;
  codes: Position[];
  /** Колір секції фільтра (активний стан) */
  color: string;
  /** Колір тексту на цьому фоні */
  text: string;
}[] = [
  { key: "ВРТ", label: "ВРТ", codes: ["ВРТ"], color: "#DB4B4B", text: "#2A0808" },
  { key: "ЗАХ", label: "ЗАХ", codes: ["ЛЗ", "ЦЗ", "ПЗ"], color: "#E5C23A", text: "#2A2208" },
  { key: "ПЗХ", label: "ПЗХ", codes: ["ЦОП", "ЦП", "ЦАП"], color: "#3FBF6E", text: "#07200F" },
  { key: "НАП", label: "НАП", codes: ["ЛВ", "ФРВ", "ПВ"], color: "#4C8DF0", text: "#06142B" },
];

export function positionGroup(code: string | null | undefined): PositionGroup | null {
  if (!code) return null;
  return POSITION_GROUPS.find((g) => (g.codes as string[]).includes(code))?.key ?? null;
}

// Порядок для сортування: ВРТ → ЛЗ, ЦЗ, ПЗ → ЦОП, ЦП, ЦАП → ЛВ, ФРВ, ПВ
// (зліва направо, як на схемі поля). Невідома позиція — в самий кінець.
const ORDER: string[] = POSITION_GROUPS.flatMap((g) => g.codes as string[]);
export function positionOrder(code: string | null | undefined): number {
  const i = code ? ORDER.indexOf(code) : -1;
  return i === -1 ? ORDER.length : i;
}
