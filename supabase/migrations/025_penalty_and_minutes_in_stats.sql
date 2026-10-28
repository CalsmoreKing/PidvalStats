-- =====================================================================
-- МІГРАЦІЯ 025 — голи з пенальті вже й так рахувались у total_goals (бо
-- goals — це загальна кількість, penalty_goals лише розбивка, не додаткові
-- голи), просто ніде не показувались окремо. Додає total_penalty_goals і
-- total_minutes у season_stats та season_stats_by_competition.
-- =====================================================================

create or replace view season_stats as
select
  p.id as player_id,
  p.full_name,
  p.team_id,
  p.position,
  p.nationality,
  p.birth_date,
  p.jersey_number,
  p.photo_url,
  count(ml.id) filter (where ml.avg_rating is not null) as matches_rated,
  sum(ml.goals) as total_goals,
  sum(ml.penalty_goals) as total_penalty_goals,
  sum(ml.assists) as total_assists,
  sum(ml.minutes_played) as total_minutes,
  sum(v.vote_count) as total_votes,
  round(
    sum(ml.avg_rating * ml.minutes_played) filter (where ml.minutes_played > 0)
    / nullif(sum(ml.minutes_played) filter (where ml.minutes_played > 0), 0)
  , 2) as weighted_season_rating
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, p.full_name, p.team_id, p.position, p.nationality, p.birth_date, p.jersey_number, p.photo_url;

create or replace view season_stats_by_competition as
select
  p.id as player_id,
  c.id as competition_id,
  c.slug as competition_slug,
  c.name as competition_name,
  count(ml.id) filter (where ml.avg_rating is not null) as matches_rated,
  sum(ml.goals) as total_goals,
  sum(ml.penalty_goals) as total_penalty_goals,
  sum(ml.assists) as total_assists,
  sum(ml.minutes_played) as total_minutes,
  sum(v.vote_count) as total_votes,
  sum(ml.avg_rating * ml.minutes_played) filter (where ml.minutes_played > 0) as rating_weighted_sum,
  sum(ml.minutes_played) filter (where ml.minutes_played > 0) as minutes_sum
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, c.id, c.slug, c.name;
