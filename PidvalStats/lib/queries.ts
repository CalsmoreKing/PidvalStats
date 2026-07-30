import { createServerSupabase } from "@/lib/supabase/server";

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
    .select("id, opponent_name, is_home, home_score, away_score, coach_rating, competitions(name)")
    .eq("status", "finalized")
    .eq("is_cancelled", false)
    .order("coach_rating", { ascending: false, nullsFirst: false })
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

export async function getAllMatches() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, opponent_name, opponent_crest_url, is_home, match_date, status, is_cancelled, home_score, away_score, coach_rating, voting_closes_at, venue, referee, coach_name, competition_id, competitions(name)"
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
    .select("*, competitions(name)")
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
      "id, is_starting, is_captain, minutes_played, goals, assists, yellow_cards, red_cards, sub_in_minute, sub_out_minute, avg_rating, formation_slot, players(id, full_name, short_name, jersey_number, photo_url, photo_focus_x, photo_focus_y, position, nationality)"
    )
    .eq("match_id", matchId);
  if (error) {
    console.error("getLineupForMatch", error);
    return [];
  }
  return data ?? [];
}

export async function getRoster(teamSlug: "first_team" | "atletic" = "first_team") {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("players")
    .select(
      "id, full_name, short_name, jersey_number, position, positions, nationality, birth_date, photo_url, photo_focus_x, photo_focus_y, teams!inner(slug)"
    )
    .eq("teams.slug", teamSlug)
    .order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("getRoster", error);
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

  const { data: history } = await supabase
    .from("match_lineups")
    .select(
      "avg_rating, minutes_played, goals, assists, is_starting, matches!inner(id, opponent_name, is_home, match_date, status, competitions(name))"
    )
    .eq("player_id", playerId)
    .eq("matches.status", "finalized")
    .order("match_date", { referencedTable: "matches", ascending: true });

  return {
    player,
    season: seasonRow ?? null,
    mvpAwards: mvpRow?.mvp_awards ?? 0,
    history: history ?? [],
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
  const supabase = createServerSupabase();
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
  const [{ data: votes }, { data: mvp }] = await Promise.all([
    supabase.from("votes").select("player_id, rating").eq("match_id", matchId).eq("voter_id", voterId),
    supabase.from("mvp_votes").select("player_id").eq("match_id", matchId).eq("voter_id", voterId).maybeSingle(),
  ]);

  if (!votes || votes.length === 0) return null;
  return {
    ratings: Object.fromEntries(votes.map((v) => [v.player_id, v.rating])) as Record<string, number>,
    mvpPlayerId: mvp?.player_id ?? null,
  };
}

export async function getFirstTeam() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("teams").select("id, name, crest_url").eq("slug", "first_team").maybeSingle();
  return data ?? null;
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
