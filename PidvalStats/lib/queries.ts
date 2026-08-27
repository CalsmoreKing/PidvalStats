import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getFirstTeamId(supabase: ReturnType<typeof createServerSupabase>) {
  const { data } = await supabase.from("teams").select("id").eq("slug", "first_team").single();
  return data?.id as string | undefined;
}

export async function getTopPlayers(limit = 3) {
  const supabase = createServerSupabase();
  const teamId = await getFirstTeamId(supabase);
  const { data, error } = await supabase
    .from("season_stats")
    .select("*")
    .eq("team_id", teamId ?? "")
    .order("weighted_season_rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getTopPlayers", error);
    return [];
  }
  return data ?? [];
}

export async function getTopMatches(limit = 3) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select("id, opponent_name, is_home, home_score, away_score, match_rating, competitions(name)")
    .eq("status", "finalized")
    .eq("is_cancelled", false)
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
      "id, opponent_name, opponent_crest_url, is_home, match_date, status, is_cancelled, home_score, away_score, match_rating, voting_closes_at, voting_opens_at, venue, referee, coach_name, competition_id, competitions(name)"
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
    .select("*, competitions(name), referees(photo_url), coaches(photo_url)")
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
    .select("matches_rated, total_goals, total_assists, total_votes, weighted_season_rating")
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
      "avg_rating, minutes_played, goals, assists, is_starting, matches!inner(id, opponent_name, is_home, match_date, status, competitions(name))"
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

  return {
    player,
    season: seasonRow ?? null,
    mvpAwards: mvpRow?.mvp_awards ?? 0,
    history,
  };
}

export async function getLastMatch() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("matches")
    .select("competition_id, is_home, coach_name")
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
    .select("id, display_name, telegram_username, telegram_id, created_at")
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
    histCounts[v.rating] = (histCounts[v.rating] ?? 0) + 1;
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

export async function getSeasonRefereeRatings() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("season_referee_ratings").select("*").order("avg_rating", { ascending: false });
  return data ?? [];
}

export async function getSeasonCoachRatings() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("season_coach_ratings").select("*").order("avg_rating", { ascending: false });
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

export async function getVoterActivity() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("voter_activity")
    .select("*")
    .order("matches_voted", { ascending: false })
    .limit(50);
  if (error) {
    console.error("getVoterActivity", error);
    return [];
  }
  return data ?? [];
}
