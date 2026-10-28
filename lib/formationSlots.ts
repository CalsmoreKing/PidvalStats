export type FormationSlotDef = { index: number; label: string; x: number; y: number };

// 4-2-3-1: 1 ВРТ, 4 захисники, 2 опорні, 3 атакувальні півзахисники, 1 форвард.
// Фіксовані координати (у %) — адмін сам призначає гравця на кожен слот,
// тому позиції завжди рівномірні, без накладання незалежно від кількості
// гравців у якійсь лінії.
export const FORMATION_SLOTS: FormationSlotDef[] = [
  { index: 0, label: "ВРТ", x: 50, y: 92 },
  { index: 1, label: "ЛЗ", x: 15, y: 74 },
  { index: 2, label: "ЦЗ", x: 37, y: 78 },
  { index: 3, label: "ЦЗ", x: 63, y: 78 },
  { index: 4, label: "ПЗ", x: 85, y: 74 },
  { index: 5, label: "ЦОП", x: 35, y: 58 },
  { index: 6, label: "ЦОП", x: 65, y: 58 },
  { index: 7, label: "ЛВ", x: 18, y: 38 },
  { index: 8, label: "ЦАП", x: 50, y: 40 },
  { index: 9, label: "ПВ", x: 82, y: 38 },
  { index: 10, label: "ФРВ", x: 50, y: 16 },
];
