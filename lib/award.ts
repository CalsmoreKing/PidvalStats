// «Підвал Д'ор»: підрахунок і перевірки. Усе чисте (без БД) — легко тестувати.

export type AwardSettings = {
  title: string;
  is_open: boolean;
  closes_at: string | null;
  show_results: boolean;
  min_matches_voted: number;
  registered_before: string | null;
  weight_base: number;
  weight_votes: number;
  weight_activity: number;
};

export type Nominee = {
  id: string;
  name: string;
  base_points: number;
  voter_id: string | null;
  is_active: boolean;
  sort_order: number;
};

export const PLACE_POINTS = [5, 4, 3, 2, 1]; // 1-е місце → 5 балів … 5-те → 1

export function votingIsOpen(s: AwardSettings, now = new Date()): boolean {
  return s.is_open && (!s.closes_at || new Date(s.closes_at) > now);
}

// «Дін», «дін!», «ДІН » → "дін" — щоб відловити голос за себе, навіть якщо
// номінанта ще не прив'язано до акаунта вручну.
export function normName(s: string | null | undefined): string {
  return (s ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function isSelfVote(
  nominee: Pick<Nominee, "voter_id" | "name">,
  voter: { id: string; names: (string | null | undefined)[] }
): boolean {
  if (nominee.voter_id && nominee.voter_id === voter.id) return true;
  const n = normName(nominee.name);
  return n.length > 0 && voter.names.some((x) => normName(x) === n);
}

export type Standing = {
  nominee: Nominee;
  basePoints: number;
  votePoints: number; // сирі бали з бюлетенів (5-4-3-2-1)
  voteScore: number; // 0..100 відносно лідера голосування
  firstPlaces: number;
  activityScore: number; // 0..100 — частка оцінених матчів
  total: number;
};

// Підсумок = зважена сума трьох шкал 0..100:
//  • база — як дав організатор (вона й так ~68–98);
//  • голосування — бали відносно лідера голосування (лідер = 100);
//  • активність — частка оцінених на сайті матчів (усі = 100).
// Ваги нормуються на суму, тож 55/35/10 і 5.5/3.5/1 — те саме.
export function computeStandings(args: {
  nominees: Nominee[];
  votes: Record<string, { points: number; first: number }>;
  matchesVoted: Record<string, number>; // voter_id → оцінено матчів
  totalMatches: number;
  settings: Pick<AwardSettings, "weight_base" | "weight_votes" | "weight_activity">;
  includeVotes: boolean;
}): Standing[] {
  const { nominees, votes, matchesVoted, totalMatches, settings, includeVotes } = args;
  const wSum = settings.weight_base + settings.weight_votes + settings.weight_activity || 1;
  const wb = settings.weight_base / wSum;
  const wv = settings.weight_votes / wSum;
  const wa = settings.weight_activity / wSum;
  const maxVotes = Math.max(0, ...nominees.map((n) => votes[n.id]?.points ?? 0));

  return nominees
    .map((n) => {
      const vp = includeVotes ? votes[n.id]?.points ?? 0 : 0;
      const voteScore = maxVotes > 0 ? (vp / maxVotes) * 100 : 0;
      const done = n.voter_id ? matchesVoted[n.voter_id] ?? 0 : 0;
      const activityScore = totalMatches > 0 ? Math.min(1, done / totalMatches) * 100 : 0;
      const total =
        Number(n.base_points) * wb + (includeVotes ? voteScore * wv : 0) + activityScore * wa;
      return {
        nominee: n,
        basePoints: Number(n.base_points),
        votePoints: vp,
        voteScore,
        firstPlaces: includeVotes ? votes[n.id]?.first ?? 0 : 0,
        activityScore,
        total: Math.round(total * 100) / 100,
      };
    })
    .sort((a, b) => b.total - a.total || b.basePoints - a.basePoints);
}
