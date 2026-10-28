-- =====================================================================
-- МІГРАЦІЯ 011 — відділити товариські матчі (competitions.slug='friendly')
-- від офіційної сезонної статистики. Нової колонки не треба — ознака вже
-- є в competitions.slug, просто раніше жодна з season_* view її не
-- враховувала.
--
-- Що змінюється: season_stats, season_mvp_counts, season_referee_ratings,
-- season_coach_ratings — тепер JOIN competitions і виключають 'friendly'.
--
-- Що НЕ змінюється навмисно: season_stats_by_competition — вона й так
-- групує по турніру, тож товариський матч просто лишається видимим у
-- СВОЇЙ вкладці на /season (не змішуючись з рештою) — саме це і є
-- "відділити, а не приховати". Заодно додав туди пропущений фільтр
-- is_cancelled (був у season_stats з міграції 007, але забули перенести
-- сюди).
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
  sum(ml.assists) as total_assists,
  sum(v.vote_count) as total_votes,
  round(
    sum(ml.avg_rating * ml.minutes_played) filter (where ml.minutes_played > 0)
    / nullif(sum(ml.minutes_played) filter (where ml.minutes_played > 0), 0)
  , 2) as weighted_season_rating
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id and c.slug <> 'friendly'
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, p.full_name, p.team_id, p.position, p.nationality, p.birth_date, p.jersey_number, p.photo_url;

create or replace view season_mvp_counts as
select
  p.id as player_id,
  p.full_name,
  count(m.id) as mvp_awards
from players p
join matches m on m.mvp_player_id = p.id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id and c.slug <> 'friendly'
group by p.id, p.full_name
order by mvp_awards desc;

create or replace view season_referee_ratings as
select
  r.id as referee_id,
  r.name,
  count(m.id) as matches,
  round(avg(m.referee_rating), 2) as avg_rating
from referees r
join matches m on m.referee_id = r.id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id and c.slug <> 'friendly'
where m.referee_rating is not null
group by r.id, r.name
order by avg_rating desc;

create or replace view season_coach_ratings as
select
  c2.id as coach_id,
  c2.name,
  count(m.id) as matches,
  round(avg(m.coach_rating), 2) as avg_rating
from coaches c2
join matches m on m.coach_id = c2.id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id and c.slug <> 'friendly'
where m.coach_rating is not null
group by c2.id, c2.name
order by avg_rating desc;

-- Бонус-фікс: відсутній is_cancelled-фільтр (був скрізь, крім цієї view)
create or replace view season_stats_by_competition as
select
  p.id as player_id,
  c.slug as competition_slug,
  c.name as competition_name,
  round(avg(ml.avg_rating), 2) as avg_rating,
  count(*) as matches_played
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id
where ml.avg_rating is not null
group by p.id, c.slug, c.name;
