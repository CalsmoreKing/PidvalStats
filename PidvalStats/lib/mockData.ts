import { PlayerCardData } from "@/components/PlayerCard";

export const mockTopPlayers: PlayerCardData[] = [
  {
    id: "1",
    full_name: "Ламін Ямаль",
    position: "ПВ",
    nationality: "Іспанія",
    birth_date: "2007-07-13",
    jersey_number: 10,
    photo_url: null,
    season_rating: 8.4,
  },
  {
    id: "2",
    full_name: "Педрі",
    position: "ЦП",
    nationality: "Іспанія",
    birth_date: "2002-11-25",
    jersey_number: 8,
    photo_url: null,
    season_rating: 8.1,
  },
  {
    id: "3",
    full_name: "Пау Кубарсі",
    position: "ЦЗ",
    nationality: "Іспанія",
    birth_date: "2007-01-22",
    jersey_number: 5,
    photo_url: null,
    season_rating: 7.9,
  },
];

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "voting_open"
  | "finalized";

export type MockMatch = {
  id: string;
  date: string;
  opponent: string;
  isHome: boolean;
  competition: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  avgRating?: number;
};

export const mockMatches: MockMatch[] = [
  {
    id: "m1",
    date: "2026-07-29",
    opponent: "Реал Мадрид",
    isHome: true,
    competition: "Ла Ліга",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    id: "m4",
    date: "2026-07-25",
    opponent: "Жирона",
    isHome: true,
    competition: "Ла Ліга",
    status: "voting_open",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m2",
    date: "2026-07-22",
    opponent: "Атлетіко Мадрид",
    isHome: false,
    competition: "Ла Ліга",
    status: "finalized",
    homeScore: 1,
    awayScore: 3,
    avgRating: 7.6,
  },
  {
    id: "m3",
    date: "2026-07-15",
    opponent: "Севілья",
    isHome: true,
    competition: "Кубок Іспанії",
    status: "finalized",
    homeScore: 4,
    awayScore: 0,
    avgRating: 8.0,
  },
];

export const mockTopMatches = mockMatches
  .filter((m) => m.avgRating)
  .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

// Мокова стартова 11 у розстановці 4-2-3-1, координати у % по полю
// (x: 0=ліво, 100=право; y: 0=атака/верх, 100=свої ворота/низ)
export type LineupSlot = {
  playerId: string;
  name: string;
  jersey: number;
  x: number;
  y: number;
  rating?: number;
};

export const mockCoach = { name: "Ганcі Флік" };

export const mockLineup: LineupSlot[] = [
  { playerId: "gk", name: "тер Штеген", jersey: 1, x: 50, y: 92, rating: 7.2 },
  { playerId: "lb", name: "Бальде", jersey: 3, x: 15, y: 74, rating: 7.5 },
  { playerId: "cb1", name: "Крістенсен", jersey: 15, x: 37, y: 78, rating: 6.9 },
  { playerId: "cb2", name: "Кубарсі", jersey: 5, x: 63, y: 78, rating: 7.1 },
  { playerId: "rb", name: "Кунде", jersey: 23, x: 85, y: 74, rating: 7.0 },
  { playerId: "dm1", name: "Касадо", jersey: 17, x: 35, y: 58, rating: 6.8 },
  { playerId: "dm2", name: "де Йонг", jersey: 21, x: 65, y: 58, rating: 7.4 },
  { playerId: "lw", name: "Рафінья", jersey: 11, x: 18, y: 38, rating: 7.8 },
  { playerId: "cam", name: "Педрі", jersey: 8, x: 50, y: 40, rating: 8.1 },
  { playerId: "rw", name: "Ямаль", jersey: 10, x: 82, y: 38, rating: 8.4 },
  { playerId: "fw", name: "Ф. Торрес", jersey: 7, x: 50, y: 16, rating: 6.7 },
];

export const mockSubs = [
  { playerId: "sub1", name: "Фермін Лопес", jersey: 16, inMinute: 68, rating: 7.0 },
  { playerId: "sub2", name: "Гаві", jersey: 6, inMinute: 75, rating: 6.5 },
];
