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
