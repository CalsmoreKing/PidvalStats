export type LineupPlayer = {
  id: string;
  name: string;
  shortName?: string | null;
  jersey: number | null;
  position: string;
  rating?: number | null;
  isCaptain?: boolean;
  photoUrl?: string | null;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  subOutMinute?: number | null;
  subInMinute?: number | null;
};

const LINE_Y: Record<string, number> = {
  ВРТ: 92,
  ЦЗ: 76,
  ЛЗ: 76,
  ПЗ: 76,
  ЦОП: 58,
  ЦП: 58,
  ЦАП: 40,
  ЛВ: 40,
  ПВ: 40,
  ФРВ: 16,
};

function xPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [50];
  const margin = 14;
  const step = (100 - margin * 2) / (count - 1);
  return Array.from({ length: count }, (_, i) => margin + step * i);
}

// Групує стартовий склад по лініях (за позицією гравця) і рівномірно
// розподіляє по горизонталі — автоматична розстановка без ручних координат.
export function layoutFormation(starters: LineupPlayer[]) {
  const lines: Record<number, LineupPlayer[]> = {};
  for (const p of starters) {
    const y = LINE_Y[p.position] ?? 50;
    lines[y] = lines[y] ?? [];
    lines[y].push(p);
  }

  const slots: (LineupPlayer & { x: number; y: number })[] = [];
  for (const [yStr, players] of Object.entries(lines)) {
    const y = Number(yStr);
    const xs = xPositions(players.length);
    players.forEach((p, i) => slots.push({ ...p, x: xs[i], y }));
  }
  return slots;
}
