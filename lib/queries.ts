import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { qualifiesForRank, weightedMean } from "@/lib/season";
import { FORMATION_SLOTS } from "@/lib/formationSlots";

async function getFirstTeamId(supabase: ReturnType<typeof createServerSupabase>) {
  const { data } = await supabase.from("teams").select("id").eq("slug", "first_team").single();
  return data?.id as string | undefined;
}

// Оцінка гравця для головної/рейтингу: чесне середнє з матчів від 25 хв,
// зважене на хвилини (джерело — view season_stats_by_competition, тому
// товариські не враховуються). У рейтинг потрапляють лише ті, хто набрав
// MIN_MATCHES_FOR_RANK залікових матчів — інакше один вдалий вихід з лавки
// переважував би цілий сезон основи.
async function seasonRatings(
  supabase: ReturnType<typeof createServerSupabase>
): Promise<{ rating: Map<string, number>; matches: Map<string, number>; minutes: Map<string, number> }> {
  const { data } = await supabase
    .from("season_stats_by_competition")
    .select("player_id, rating_weighted_sum, minutes_sum, matches_rated")
    .neq("competition_slug", "friendly");
  const byPlayer = new Map<string, { weightedSum: number; minutesSum: number; matches: number }>();
  for (const row of data ?? []) {
    const cur = byPlayer.get(row.player_id) ?? { weightedSum: 0, minutesSum: 0, matches: 0 };
    cur.weightedSum += row.rating_weighted_sum ?? 0;
    cur.minutesSum += row.minutes_sum ?? 0;
    cur.matches += row.matches_rated ?? 0;
    byPlayer.set(row.player_id, cur);
  }
  const rating = new Map<string, number>();
  const matches = new Map<string, number>();
  const minutes = new Map<string, number>();
  for (const [playerId, v] of byPlayer) {
    matches.set(playerId, v.matches);
    minutes.set(playerId, v.minutesSum);
    const mean = weightedMean(v.weightedSum, v.minutesSum);
    if (mean != null) rating.set(playerId, Math.round(mean * 100) / 100);
  }
  return { rating, matches, minutes };
}

// Спільний відбір для Топ-3 / Дно-3.
async function rankedPlayers(limit: number, direction: "top" | "bottom") {
  const supabase = createServerSupabase();
  const teamId = await getFirstTeamId(supabase);
  const { rating, matches, minutes } = await seasonRatings(supabase);

  const ranked = Array.from(rating.entries())
    .map(([playerId, value]) => ({
      playerId,
      rating: value,
      matches: matches.get(playerId) ?? 0,
      minutes: minutes.get(playerId) ?? 0,
    }))
    .filter((r) => qualifiesForRank(r.matches, r.minutes))
    .sort((x, y) => (direction === "top" ? y.rating - x.rating : x.rating - y.rating))
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const ids = ranked.map((r) => r.playerId);
  const [{ data: players }, { data: totals }] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, team_id, position, nationality, birth_date, jersey_number, photo_url")
      .in("id", ids)
      .eq("team_id", teamId ?? ""),
    // Голи + асисти за сезон — для бейджа «Г+П» на картці гравця.
    supabase
      .from("season_stats_by_competition")
      .select("player_id, total_goals, total_assists")
      .in("player_id", ids)
      .neq("competition_slug", "friendly"),
  ]);
  const totalsById = new Map<string, { goals: number; assists: number }>();
  for (const row of totals ?? []) {
    const cur = totalsById.get(row.player_id) ?? { goals: 0, assists: 0 };
    cur.goals += row.total_goals ?? 0;
    cur.assists += row.total_assists ?? 0;
    totalsById.set(row.player_id, cur);
  }

  return ranked
    .map((r) => {
      const p = players?.find((pl) => pl.id === r.playerId);
      if (!p) return null;
      const t = totalsById.get(p.id);
      return {
        ...p,
        player_id: p.id,
        weighted_season_rating: r.rating,
        goals: t?.goals ?? 0,
        assists: t?.assists ?? 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p != null);
}

export async function getTopPlayers(limit = 3) {
  return rankedPlayers(limit, "top");
}

export async function getBottomPlayers(limit = 3) {
  return rankedPlayers(limit, "bottom");
}

export async function getTopMatches(limit = 3) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, opponent_name, is_home, home_score, away_score, match_rating, round_number, competitions!inner(name, slug, round_label)"
    )
    .eq("status", "finalized")
    .eq("is_cancelled", false)
    .neq("competitions.slug", "friendly")
    .order("match_rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getTopMatches", error);
    return [];
  }
  return data ?? [];
}

export async function getSeasonRows() {
  const supabase = createServerSupabase();
  const teamId = await getFirstTeamId(supabase);
  const { data, error } = await supabase
    .from("season_stats")
    .select("*")
    .eq("team_id", teamId ?? "")
    .order("weighted_season_rating", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("getSeasonRows", error);
    return [];
  }
  return data ?? [];
}

export async function getSeasonRowsByCompetition() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("season_stats_by_competition").select("*");
  if (error) {
    console.error("getSeasonRowsByCompetition", error);
    return [];
  }
  return data ?? [];
}

export async function getAllMatches() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, opponent_name, opponent_crest_url, is_home, match_date, status, is_cancelled, home_score, away_score, match_rating, voting_closes_at, voting_opens_at, is_extra_time, venue, referee, referee_id, coach_name, coach_id, competition_id, round_number, competitions(name, round_label), referees(photo_url)"
    )
    .order("match_date", { ascending: false });
  if (error) {
    console.error("getAllMatches", error);
    return [];
  }
  return data ?? [];
}

export async function getMatchById(id: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select("*, competitions(name, round_label), referees(photo_url), coaches(photo_url)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getMatchById", error);
    return null;
  }
  return data;
}

export async function getLineupForMatch(matchId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("match_lineups")
    .select(
      "id, is_starting, is_captain, minutes_played, goals, penalty_goals, assists, yellow_cards, red_cards, sub_in_minute, sub_out_minute, sub_for_player_id, avg_rating, formation_slot, fun_fact, players!match_lineups_player_id_fkey(id, full_name, short_name, jersey_number, photo_url, photo_focus_x, photo_focus_y, photo_zoom, position, nationality)"
    )
    .eq("match_id", matchId);
  if (error) {
    console.error("getLineupForMatch", error);
    return [];
  }
  return data ?? [];
}

export async function getRoster(
  teamSlug: "first_team" | "atletic" = "first_team",
  opts: { activeOnly?: boolean } = {}
) {
  const { activeOnly = true } = opts;
  const supabase = createServerSupabase();
  let filtered = supabase
    .from("players")
    .select(
      "id, full_name, short_name, jersey_number, position, positions, nationality, birth_date, photo_url, photo_focus_x, photo_focus_y, photo_zoom, teams!inner(slug)"
    )
    .eq("teams.slug", teamSlug);
  // За замовчуванням лише активні — конструктор складу не повинен пропонувати
  // гравців, яких адмін вже архівував (покинули команду). Фільтр додається
  // ДО .order(), щоб не переприсвоювати змінну білдера різних "стадій" типу
  // (після .order() у Supabase-типах вже немає .eq()).
  if (activeOnly) filtered = filtered.eq("is_active", true);
  const { data, error } = await filtered.order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("getRoster", error);
    return [];
  }
  return data ?? [];
}

// Усі гравці обох команд + архів — для вкладки "Гравці" в адмінці, де керуємо
// складом команд (перетягування між командами, архівація).
export async function getFullRoster() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, full_name, short_name, jersey_number, position, positions, nationality, birth_date, photo_url, photo_focus_x, photo_focus_y, photo_zoom, is_active, team_id, teams!inner(slug, name)"
    )
    .order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("getFullRoster", error);
    return [];
  }
  return data ?? [];
}

export async function getAllTeams() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("teams")
    .select("id, slug, name")
    .order("slug", { ascending: false }); // 'first_team' перед 'atletic'
  if (error) {
    console.error("getAllTeams", error);
    return [];
  }
  return data ?? [];
}

export async function getPlayerProfile(playerId: string) {
  const supabase = createServerSupabase();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, full_name, position, nationality, birth_date, jersey_number, photo_url, team_id")
    .eq("id", playerId)
    .maybeSingle();
  if (playerError || !player) return null;

  const { data: seasonRow } = await supabase
    .from("season_stats")
    .select("matches_rated, total_goals, total_penalty_goals, total_assists, total_minutes, total_votes, weighted_season_rating")
    .eq("player_id", playerId)
    .maybeSingle();

  const { data: mvpRow } = await supabase
    .from("season_mvp_counts")
    .select("mvp_awards")
    .eq("player_id", playerId)
    .maybeSingle();

  const { data: historyRaw } = await supabase
    .from("match_lineups")
    .select(
      "avg_rating, minutes_played, goals, assists, is_starting, formation_slot, matches!inner(id, opponent_name, is_home, match_date, status, competitions(name))"
    )
    .eq("player_id", playerId)
    .eq("matches.status", "finalized");

  // ВАЖЛИВО: .order(col, { referencedTable }) в Supabase сортує рядки
  // ВСЕРЕДИНІ вкладеного масиву (коли embed — це "багато"), а не батьківські
  // рядки за полем зв'язаної таблиці — тут запит саме навпаки (match_lineups
  // "багато", matches "один"), тому PostgREST цю умову просто ігнорував і
  // матчі показувались у випадковому порядку. Сортуємо надійно в JS.
  const history = [...(historyRaw ?? [])].sort(
    (a: any, b: any) => new Date(a.matches.match_date).getTime() - new Date(b.matches.match_date).getTime()
  );

  // Оцінка профілю — те саме чесне середнє (зважене на хвилини) з матчів
  // від 25 хв, що й у таблиці Сезону. Без згладжування.
  let season = seasonRow ?? null;
  if (season?.weighted_season_rating != null) {
    const { data: allRows } = await supabase
      .from("season_stats_by_competition")
      .select("player_id, rating_weighted_sum, minutes_sum, matches_rated")
      .neq("competition_slug", "friendly");
    const acc = new Map<string, { w: number; m: number }>();
    for (const row of allRows ?? []) {
      const cur = acc.get(row.player_id) ?? { w: 0, m: 0 };
      cur.w += row.rating_weighted_sum ?? 0;
      cur.m += row.minutes_sum ?? 0;
      acc.set(row.player_id, cur);
    }
    const mine = acc.get(playerId);
    const mean = mine ? weightedMean(mine.w, mine.m) : null;
    if (mean != null) {
      season = { ...season, weighted_season_rating: Math.round(mean * 10) / 10 };
    }
  }

  // Розбивка «на яких позиціях скільки матчів і хвилин». Позицію беремо зі
  // слота схеми (саме так адмін ставить склад), а не з поля position у
  // картці гравця — інакше Рафінья, який реально грає ФРВ, показувався б як ЛВ.
  const byPosition = new Map<string, { matches: number; minutes: number; goals: number; assists: number }>();
  for (const row of history as any[]) {
    const label = FORMATION_SLOTS[row.formation_slot ?? -1]?.label ?? "поза схемою";
    const cur = byPosition.get(label) ?? { matches: 0, minutes: 0, goals: 0, assists: 0 };
    cur.matches += 1;
    cur.minutes += row.minutes_played ?? 0;
    cur.goals += row.goals ?? 0;
    cur.assists += row.assists ?? 0;
    byPosition.set(label, cur);
  }
  const positions = Array.from(byPosition.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.minutes - a.minutes);

  // Позиція «по всіх матчах сезону»: той слот, де гравець провів найбільше
  // хвилин. Картка гравця в адмінці лишається ручною, тут — фактична.
  const derivedPosition = positions[0]?.label ?? player.position;
  const positionMix = positions.map((p) => `${p.label} ${p.matches}`).join(" · ");

  return {
    player,
    season,
    mvpAwards: mvpRow?.mvp_awards ?? 0,
    history,
    positions,
    derivedPosition,
    positionMix,
  };
}

export async function getLastMatch() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("matches")
    .select("competition_id, is_home, coach_name, coach_id")
    .order("match_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getVoters() {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("voters")
    .select("id, display_name, custom_display_name, telegram_username, telegram_id, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getVoters", error);
    return [];
  }
  return data ?? [];
}

export async function getMyVotesForMatch(matchId: string) {
  const { getVoterIdFromCookie } = await import("@/lib/supabase/authed");
  const { createServiceClient } = await import("@/lib/supabase/service");

  const voterId = getVoterIdFromCookie();
  if (!voterId) return null;

  const supabase = createServiceClient();
  const [{ data: votes }, { data: mvp }, { data: coachVote }, { data: refVote }] = await Promise.all([
    supabase.from("votes").select("player_id, rating").eq("match_id", matchId).eq("voter_id", voterId),
    supabase.from("mvp_votes").select("player_id").eq("match_id", matchId).eq("voter_id", voterId).maybeSingle(),
    supabase.from("coach_votes").select("rating").eq("match_id", matchId).eq("voter_id", voterId).maybeSingle(),
    supabase.from("referee_votes").select("rating").eq("match_id", matchId).eq("voter_id", voterId).maybeSingle(),
  ]);

  if (!votes || votes.length === 0) return null;
  return {
    ratings: Object.fromEntries(votes.map((v) => [v.player_id, v.rating])) as Record<string, number>,
    mvpPlayerId: mvp?.player_id ?? null,
    coachRating: coachVote?.rating ?? null,
    refereeRating: refVote?.rating ?? null,
  };
}

export async function getVoterStats(voterId: string) {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();

  const { data: votes } = await supabase.from("votes").select("player_id, rating").eq("voter_id", voterId);
  if (!votes || votes.length === 0) return { top: [], bottom: [], histogram: [] };

  const byPlayer: Record<string, number[]> = {};
  const histCounts: Record<number, number> = {};
  for (const v of votes) {
    byPlayer[v.player_id] = byPlayer[v.player_id] ?? [];
    byPlayer[v.player_id].push(v.rating);
    // гістограма — по цілих балах: 5.5 потрапляє в «5», 9.5 — в «9»
    const bucket = Math.min(10, Math.max(1, Math.floor(Number(v.rating))));
    histCounts[bucket] = (histCounts[bucket] ?? 0) + 1;
  }
  const averaged = Object.entries(byPlayer).map(([playerId, ratings]) => ({
    playerId,
    avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    count: ratings.length,
  }));

  const top = [...averaged].sort((a, b) => b.avg - a.avg).slice(0, 3);
  const bottom = [...averaged].sort((a, b) => a.avg - b.avg).slice(0, 3);
  const histogram = Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: histCounts[i + 1] ?? 0 }));

  const ids = [...new Set([...top, ...bottom].map((a) => a.playerId))];
  const { data: players } = await supabase
    .from("players")
    .select("id, full_name, jersey_number, photo_url, position, nationality, birth_date")
    .in("id", ids);

  const attach = (arr: typeof top) =>
    arr.map((a) => ({
      ...players?.find((p) => p.id === a.playerId),
      myAverage: Math.round(a.avg * 10) / 10,
      voteCount: a.count,
    }));

  return { top: attach(top), bottom: attach(bottom), histogram };
}

export async function getRefereeNames() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("referees").select("name").order("name");
  return (data ?? []).map((r) => r.name);
}

export async function getCoachNames() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("coaches").select("name").order("name");
  return (data ?? []).map((c) => c.name);
}

// Судді/тренери без жодного голосу мають avg_rating = NULL. PostgREST без
// nullsFirst:false ставить NULL ПЕРШИМИ при desc — через це «Кінтеро Гонсалес»
// з 0 голосів очолював рейтинг на головній. Тепер без оцінки — завжди внизу.
export async function getSeasonRefereeRatings() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("season_referee_ratings")
    .select("*")
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getSeasonCoachRatings() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("season_coach_ratings")
    .select("*")
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getFirstTeam() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("teams").select("id, name, crest_url").eq("slug", "first_team").maybeSingle();
  return data ?? null;
}

export async function getReferees() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("referees").select("id, name, photo_url").order("name");
  if (error) {
    console.error("getReferees", error);
    return [];
  }
  return data ?? [];
}

export async function getAdmins() {
  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from("admins")
    .select("id, role, title, created_at, voter_id")
    .order("created_at");
  if (error) {
    console.error("getAdmins", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  // Окремим запитом, а не вкладеним embed — admins має ДВІ зовнішні
  // прив'язки до voters (voter_id і granted_by), і навіть з явним
  // !admins_voter_id_fkey раніше ловили порожні імена. Так надійніше.
  const voterIds = [...new Set(rows.map((r) => r.voter_id))];
  const { data: voters, error: votersError } = await supabase
    .from("voters")
    .select("id, display_name, telegram_username, custom_display_name, custom_avatar_url, avatar_url")
    .in("id", voterIds);
  if (votersError) console.error("getAdmins voters", votersError);

  return rows.map((r) => ({
    ...r,
    voter: voters?.find((v) => v.id === r.voter_id) ?? null,
  }));
}

export async function getCreditHelpers() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("credit_helpers")
    .select("id, name, title, photo_url")
    .order("sort_order")
    .order("created_at");
  if (error) {
    console.error("getCreditHelpers", error);
    return [];
  }
  return data ?? [];
}

export async function getCoaches() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("coaches").select("id, name, photo_url").order("name");
  if (error) {
    console.error("getCoaches", error);
    return [];
  }
  return data ?? [];
}

export async function getCompetitions() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("competitions")
    .select("id, slug, name")
    .order("sort_order");
  if (error) {
    console.error("getCompetitions", error);
    return [];
  }
  return data ?? [];
}

// Часткові (ще не фінальні) середні оцінки, поки голосування триває. Рахує
// сама БД (функції з міграції 031) — раніше тут тягнули ВСІ голоси в JS, а
// PostgREST віддає максимум 1000 рядків, тож при сотнях фанатів середні
// мовчки ставали б неправильними.
export async function getLiveRatings(matchId: string): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("live_match_ratings", { p_match_id: matchId });
  if (error || !data) {
    if (error) console.error("getLiveRatings", error);
    return {};
  }
  const result: Record<string, number> = {};
  for (const row of data as { player_id: string; avg_rating: number | string }[]) {
    result[row.player_id] = Number(row.avg_rating);
  }
  return result;
}

// Той самий принцип, що й getLiveRatings, але для тренера й судді.
export async function getLiveStaffRating(
  table: "coach_votes" | "referee_votes",
  matchId: string
): Promise<number | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("live_staff_rating", {
    p_kind: table === "coach_votes" ? "coach" : "referee",
    p_match_id: matchId,
  });
  if (error || data == null) {
    if (error) console.error("getLiveStaffRating", error);
    return null;
  }
  return Number(data);
}

// Скільки людей уже проголосувало в цьому матчі (різні фанати).
export async function getMatchVotersCount(matchId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("match_voters_count", { p_match_id: matchId });
  if (error) {
    console.error("getMatchVotersCount", error);
    return 0;
  }
  return Number(data ?? 0);
}

// Один рядок = гравець у матчі (view season_player_matches). Таблиця «Сезон»
// сама рахує з цього будь-яку комбінацію фільтрів. Вибираємо сторінками по
// 1000 — це жорсткий ліміт PostgREST на один запит.
export async function getSeasonPlayerMatches() {
  const supabase = createServerSupabase();
  const pageSize = 1000;
  const all: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("season_player_matches")
      .select("*")
      .order("match_date", { ascending: true })
      .order("player_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("getSeasonPlayerMatches", error);
      break;
    }
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

// Іконки від дизайнера (вкладка «Іконки» в адмінці): { goal: "https://…" }
export async function getCustomIcons(): Promise<Record<string, string>> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("custom_icons").select("key, url");
  if (error || !data) return {};
  return Object.fromEntries(data.map((r: any) => [r.key, r.url]));
}

// ---------------------------------------------------------------------
// ПРОФІЛЬ ФАНАТА — публічна історія голосів (тільки завершені матчі, щоб
// не показувати "живі" голоси до підрахунку — це вплинуло б на інших).
// ---------------------------------------------------------------------

export async function getVoterProfile(voterId: string) {
  // ВАЖЛИВО: анонімний клієнт тут не підходить — RLS на voters дозволяє
  // читати лише "свій" рядок через auth.jwt()->>'voter_id', а цей проєкт
  // не використовує Supabase Auth (логін через Telegram-бота й власну
  // cookie-сесію), тому auth.jwt() завжди порожній і жоден рядок ніколи
  // не пройде цю умову — профіль будь-кого (і свій власний) завжди
  // повертав би 404. Це навмисно публічна сторінка, тому службовий ключ
  // тут доречний — так само, як getVoters() в адмінці.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("voters")
    .select("id, display_name, telegram_username, avatar_url, custom_display_name, custom_avatar_url, show_ratings")
    .eq("id", voterId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    displayName: data.custom_display_name || data.display_name || data.telegram_username || "Фанат",
    avatarUrl: data.custom_avatar_url || data.avatar_url,
    showRatings: data.show_ratings,
  };
}

export async function getVoterVoteHistory(voterId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("voter_vote_history")
    .select("*")
    .eq("voter_id", voterId)
    .order("match_date", { ascending: false });
  if (error) {
    console.error("getVoterVoteHistory", error);
    return [];
  }
  return data ?? [];
}

// Скільки матчів сезону кожен гравець провів на кожному слоті схеми —
// для підказок в адмін-редакторі складу (щоб не тикати навмання).
export async function getSeasonSlotCounts(): Promise<Record<string, Record<string, number>>> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("match_lineups")
    .select("player_id, formation_slot, matches!inner(status)")
    .eq("matches.status", "finalized");
  const out: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const label = FORMATION_SLOTS[row.formation_slot ?? -1]?.label;
    if (!label) continue;
    out[row.player_id] = out[row.player_id] ?? {};
    out[row.player_id][label] = (out[row.player_id][label] ?? 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------
// ФАНАТИ
// ---------------------------------------------------------------------

export type VoterActivity = {
  voter_id: string;
  display_name: string | null;
  avatar_url: string | null;
  matches_voted: number;
  total_ratings_given: number;
  avg_rating_given: number | null;
  quality_matches: number;
};

const VOTER_COLUMNS =
  "voter_id, display_name, avatar_url, matches_voted, total_ratings_given, avg_rating_given, quality_matches";

// «Сила голосу» — скільки матчів із 21 завершеного фанат оцінив. Показуємо
// у відсотках: 100% = голосував у кожному матчі сезону. Дружні не рахуються —
// вони давно закінчились і лише розмивають картину.
async function finalizedMatchStats() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("matches")
    .select("id, competitions!inner(slug)")
    .eq("status", "finalized")
    .eq("is_cancelled", false)
    .neq("competitions.slug", "friendly");
  const ids = new Set((data ?? []).map((m: any) => m.id));
  return { total: ids.size, ids };
}

export type VoterDetail = VoterActivity & {
  coverage: number; // % завершених матчів, у яких фанат голосував
  perfect_scores: number; // скільки разів ставив 10
  lowest_scores: number; // скільки разів ставив оцінку ≤ 4
  mvp_matches: number; // у скількох матчах вибирав МВП
  first_vote_at: string | null;
  last_vote_at: string | null;
  streak_days: number; // днів поспіль тривала робота (найдовша серія матчів)
};

export async function getVotersOverview() {
  const supabase = createServerSupabase();
  const [{ data: rows, error }, { total }] = await Promise.all([
    supabase.from("voter_activity").select(VOTER_COLUMNS).order("matches_voted", { ascending: false }),
    finalizedMatchStats(),
  ]);
  if (error) {
    console.error("getVotersOverview", error);
    return { voters: [] as VoterDetail[], totalMatches: total };
  }
  const voters: VoterDetail[] = (rows ?? []).map((v: any) => ({
    ...v,
    avg_rating_given: v.avg_rating_given != null ? Number(v.avg_rating_given) : null,
    coverage: total > 0 ? Math.round((v.matches_voted / total) * 100) : 0,
    perfect_scores: 0,
    lowest_scores: 0,
    mvp_matches: 0,
    first_vote_at: null,
    last_vote_at: null,
    streak_days: 0,
  }));
  return { voters, totalMatches: total };
}

// Деталі по кожному фанату для сторінки «Фанати»: голоси, крайні оцінки,
// МВП, період активності. Один запит на всі голоси — далі рахуємо в JS,
// щоб не робити N запитів на N фанатів.
export async function getVotersDetailed() {
  const supabase = createServerSupabase();
  // Самі votes/mvp_votes анонімно не читаються (RLS: агрегати лише через
  // view), тому для підрахунку крайніх оцінок беремо service-клієнт —
  // назовні віддаємо тільки цифри, не самі голоси.
  const admin = createServiceClient();
  const [{ data: rows, error }, { total }, { data: votes }, { data: mvps }] = await Promise.all([
    supabase.from("voter_activity").select(VOTER_COLUMNS).order("matches_voted", { ascending: false }),
    finalizedMatchStats(),
    admin.from("votes").select("voter_id, match_id, rating"),
    admin.from("mvp_votes").select("voter_id, match_id"),
  ]);
  if (error) {
    console.error("getVotersDetailed", error);
    return { voters: [] as VoterDetail[], totalMatches: total };
  }

  const acc = new Map<
    string,
    { perfect: number; low: number; mvpByMatch: Set<string> }
  >();
  for (const v of votes ?? []) {
    const cur = acc.get(v.voter_id) ?? { perfect: 0, low: 0, mvpByMatch: new Set<string>() };
    const r = Number(v.rating);
    if (r >= 10) cur.perfect += 1;
    if (r <= 4) cur.low += 1;
    acc.set(v.voter_id, cur);
  }
  for (const m of mvps ?? []) {
    const cur = acc.get(m.voter_id);
    if (cur) cur.mvpByMatch.add(m.match_id);
  }

  const voters: VoterDetail[] = (rows ?? []).map((v: any) => {
    const extra = acc.get(v.voter_id);
    return {
      ...v,
      avg_rating_given: v.avg_rating_given != null ? Number(v.avg_rating_given) : null,
      coverage: total > 0 ? Math.round((v.matches_voted / total) * 100) : 0,
      perfect_scores: extra?.perfect ?? 0,
      lowest_scores: extra?.low ?? 0,
      mvp_matches: extra?.mvpByMatch.size ?? 0,
      first_vote_at: null,
      last_vote_at: null,
      streak_days: 0,
    };
  });
  return { voters, totalMatches: total };
}

// Сумісність: головна бере топ-5 фанатів саме тут.
export async function getVoterActivity() {
  const { voters } = await getVotersDetailed();
  return [...voters]
    .sort((a, b) => b.matches_voted - a.matches_voted || b.quality_matches - a.quality_matches)
    .slice(0, 50);
}

// ---------------------------------------------------------------------
// «ПІДВАЛ Д'ОР»
// ---------------------------------------------------------------------

export async function getAwardData() {
  const supabase = createServiceClient();
  const [{ data: settings }, { data: nominees }, { data: standings }, { data: site }, { data: special }] =
    await Promise.all([
      supabase.from("award_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("award_nominees").select("*").order("sort_order").order("name"),
      supabase.rpc("award_standings"),
      supabase.rpc("award_site_progress"),
      supabase.from("award_special").select("*").order("sort_order"),
    ]);
  const votes: Record<string, { points: number; first: number }> = {};
  for (const s of (standings ?? []) as any[]) votes[s.nominee_id] = { points: s.vote_points, first: s.first_places };
  const matchesVoted: Record<string, number> = {};
  let totalMatches = 0;
  for (const a of (site ?? []) as any[]) {
    matchesVoted[a.voter_id] = Number(a.matches_done);
    totalMatches = Number(a.matches_total);
  }
  if (totalMatches === 0) {
    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "finalized")
      .eq("is_cancelled", false);
    totalMatches = count ?? 0;
  }
  return {
    settings: settings as any,
    nominees: (nominees ?? []).map((n: any) => ({ ...n, base_points: Number(n.base_points) })) as any[],
    votes,
    matchesVoted,
    totalMatches,
    special: ((special ?? []) as any[]).map((x) => ({ ...x, stat_score: x.stat_score != null ? Number(x.stat_score) : null })),
  };
}
