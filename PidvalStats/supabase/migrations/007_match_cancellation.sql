-- =====================================================================
-- МІГРАЦІЯ 007 — можливість скасувати матч (перекреслюється, статистика
-- з нього не враховується, навіть якщо дані вже були внесені).
-- =====================================================================

alter table matches add column if not exists is_cancelled boolean not null default false;

-- Перераховуємо season_stats і season_mvp_counts так, щоб скасовані матчі
-- ігнорувались навіть якщо в них є голоси/склад.
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
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, p.full_name, p.team_id;

create or replace view season_mvp_counts as
select
  p.id as player_id,
  p.full_name,
  count(m.id) as mvp_awards
from players p
join matches m on m.mvp_player_id = p.id and m.status = 'finalized' and not m.is_cancelled
group by p.id, p.full_name
order by mvp_awards desc;
