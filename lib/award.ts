// «Підвал д'Ор»: підрахунок, правила й пошук акаунтів. Усе чисте (без БД).

export type AwardSettings = {
  title: string;
  is_open: boolean;
  closes_at: string | null;
  show_results: boolean;
  min_matches_voted: number;
  registered_before: string | null;
  weight_base: number; // статистика чату
  weight_votes: number; // голосування учасників
  weight_activity: number; // активність на сайті
  min_complete_ratings: number;
};

export type StatCats = {
  activity: { total: number; messages: number; days: number; text: number };
  impact: { total: number; replies: number; reactions: number; people: number };
  dialog: { total: number; given: number; people: number };
  content: { total: number; media: number; long: number };
  quality: { total: number; length: number; reactions: number };
};
export type StatRaw = {
  messages: number;
  days: number;
  chars: number;
  replies_received: number;
  repliers: number;
  reactions: number;
  replies_given: number;
  talked_to: number;
  avg_len: number;
  reactions_per_msg: number;
  long_msgs: number;
};
export type NomineeStats = { cats: StatCats; raw: StatRaw } | null;

export type Nominee = {
  id: string;
  name: string;
  base_points: number; // статистичний бал 0–100
  voter_id: string | null;
  is_active: boolean;
  sort_order: number;
  stats?: NomineeStats;
  stat_rank?: number | null;
};

export type SpecialNomination = {
  id: string;
  sort_order: number;
  emoji: string | null;
  title: string;
  winner_name: string;
  stat_score: number | null;
  stats: [string, string][];
};

export const PLACE_POINTS = [5, 4, 3, 2, 1]; // 1-е місце → 5 балів … 5-те → 1

// Категорії статистичного балу: ключ, назва, максимум, підкритерії
export const STAT_CATEGORIES = [
  { key: "activity", label: "Активність", max: 33, parts: [["messages", "Повідомлення", 12], ["days", "Активні дні", 13], ["text", "Обсяг тексту", 8]] },
  { key: "impact", label: "Вплив", max: 40, parts: [["replies", "Отримані відповіді", 17], ["reactions", "Реакції", 13], ["people", "Різні люди, що відповідали", 10]] },
  { key: "dialog", label: "Діалог", max: 15, parts: [["given", "Відповіді іншим", 9], ["people", "Різні співрозмовники", 6]] },
  { key: "content", label: "Контент", max: 8, parts: [["media", "Медіа, посилання, опитування", 5], ["long", "Довгі повідомлення", 3]] },
  { key: "quality", label: "Якість", max: 4, parts: [["length", "Середня довжина тексту", 2], ["reactions", "Реакції на повідомлення", 2]] },
] as const;

export function votingIsOpen(s: AwardSettings, now = new Date()): boolean {
  return s.is_open && (!s.closes_at || new Date(s.closes_at) > now);
}

// ---------------------------------------------------------------------
// ІМЕНА: нормалізація, транслітерація, схожість
// ---------------------------------------------------------------------

// «Дін», «дін!», «ДІН », «𝙳𝚒𝚗» → однаковий рядок
export function normName(s: string | null | undefined): string {
  return (s ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
  ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya", ы: "y", э: "e", ё: "yo", ъ: "",
};
export function translit(norm: string): string {
  return Array.from(norm).map((ch) => TR[ch] ?? ch).join("");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
const sim = (a: string, b: string) => (a && b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 0);

// 1 — збіг після нормалізації; 0.96 — збіг лише через транслітерацію
// («Дін» ↔ «Din»); нижче — схожість / входження одного імені в інше.
export function nameScore(a: string | null | undefined, b: string | null | undefined): number {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const tx = translit(x);
  const ty = translit(y);
  if (tx === ty) return 0.96;
  let s = Math.max(sim(x, y), 0.95 * sim(tx, ty));
  const [short, long] = x.length <= y.length ? [tx, ty] : [ty, tx];
  if (short.length >= 3 && long.includes(short)) s = Math.max(s, 0.6 + 0.3 * (short.length / long.length));
  return s;
}

export type VoterLite = {
  id: string;
  display_name: string | null;
  custom_display_name?: string | null;
  telegram_username: string | null;
};

export function voterLabel(v: VoterLite): string {
  return v.custom_display_name || v.display_name || v.telegram_username || "Без імені";
}

export function voterScore(query: string, v: VoterLite): number {
  return Math.max(
    nameScore(query, v.display_name),
    nameScore(query, v.custom_display_name),
    nameScore(query, v.telegram_username)
  );
}

// Рейтинг акаунтів для пошуку: найближчі за іменем — першими.
export function rankVoters(query: string, voters: VoterLite[]): { voter: VoterLite; score: number }[] {
  return voters
    .map((voter) => ({ voter, score: voterScore(query, voter) }))
    .sort((a, b) => b.score - a.score);
}

// Обережна автоприв'язка: лише ТОЧНИЙ збіг (після нормалізації) і лише
// якщо він єдиний, а акаунт ще не прив'язаний до іншого номінанта.
export function autoLinkProposals(
  nominees: Pick<Nominee, "id" | "name" | "voter_id" | "is_active">[],
  voters: VoterLite[]
): { nomineeId: string; voterId: string }[] {
  const taken = new Set(nominees.map((n) => n.voter_id).filter(Boolean) as string[]);
  const free = voters.filter((v) => !taken.has(v.id));
  const out: { nomineeId: string; voterId: string }[] = [];
  const used = new Set<string>();
  for (const n of nominees) {
    if (n.voter_id || !n.is_active) continue;
    const exact = free.filter((v) => !used.has(v.id) && voterScore(n.name, v) >= 0.999);
    if (exact.length === 1) {
      out.push({ nomineeId: n.id, voterId: exact[0].id });
      used.add(exact[0].id);
    }
  }
  return out;
}

export function isSelfVote(
  nominee: Pick<Nominee, "voter_id" | "name">,
  voter: { id: string; names: (string | null | undefined)[] }
): boolean {
  if (nominee.voter_id && nominee.voter_id === voter.id) return true;
  const n = normName(nominee.name);
  return n.length > 0 && voter.names.some((x) => normName(x) === n);
}

// ---------------------------------------------------------------------
// ПІДРАХУНОК
// ---------------------------------------------------------------------

export type Standing = {
  nominee: Nominee;
  statScore: number; // 0–100, як дав організатор
  votePoints: number; // сирі бали з бюлетенів (5-4-3-2-1)
  voteScore: number; // 0–100: 100 × бали / бали лідера голосування
  firstPlaces: number;
  siteDone: number; // оцінених на сайті матчів
  siteScore: number; // 0–100: 100 × оцінені / усі матчі
  statPart: number; // внесок у підсумок (бал × вага)
  votePart: number;
  sitePart: number;
  total: number;
};

// Підсумок = 0,40 × статистика + 0,50 × голосування + 0,10 × сайт
// (ваги нормуються на суму, тож 40/50/10 і 4/5/1 — те саме).
export function computeStandings(args: {
  nominees: Nominee[];
  votes: Record<string, { points: number; first: number }>;
  matchesVoted: Record<string, number>; // voter_id → оцінено матчів повним комплектом
  totalMatches: number;
  settings: Pick<AwardSettings, "weight_base" | "weight_votes" | "weight_activity">;
  includeVotes: boolean;
}): Standing[] {
  const { nominees, votes, matchesVoted, totalMatches, settings, includeVotes } = args;
  const wSum = Number(settings.weight_base) + Number(settings.weight_votes) + Number(settings.weight_activity) || 1;
  const wb = Number(settings.weight_base) / wSum;
  const wv = Number(settings.weight_votes) / wSum;
  const wa = Number(settings.weight_activity) / wSum;
  const maxVotes = Math.max(0, ...nominees.map((n) => votes[n.id]?.points ?? 0));

  return nominees
    .map((n) => {
      const stat = Number(n.base_points);
      const vp = includeVotes ? votes[n.id]?.points ?? 0 : 0;
      const voteScore = maxVotes > 0 ? (vp / maxVotes) * 100 : 0;
      const done = n.voter_id ? matchesVoted[n.voter_id] ?? 0 : 0;
      const siteScore = totalMatches > 0 ? Math.min(1, done / totalMatches) * 100 : 0;
      const statPart = stat * wb;
      const votePart = includeVotes ? voteScore * wv : 0;
      const sitePart = includeVotes ? siteScore * wa : 0;
      return {
        nominee: n,
        statScore: stat,
        votePoints: vp,
        voteScore,
        firstPlaces: includeVotes ? votes[n.id]?.first ?? 0 : 0,
        siteDone: done,
        siteScore,
        statPart,
        votePart,
        sitePart,
        total: Math.round((statPart + votePart + sitePart) * 100) / 100,
      };
    })
    .sort((a, b) => b.total - a.total || b.votePoints - a.votePoints || b.statScore - a.statScore);
}

export const fmt2 = (n: number) => n.toFixed(2).replace(".", ",");
export const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");
