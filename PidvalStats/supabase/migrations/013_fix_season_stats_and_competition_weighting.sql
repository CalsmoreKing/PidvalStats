-- =====================================================================
-- МІГРАЦІЯ 013 — фікс двох багів одразу:
--
-- 1) "Сезон" спорожнів після міграції 011: season_stats/season_mvp_counts/
--    season_referee_ratings/season_coach_ratings виключали 'friendly', а
--    ВСІ 4 підсумовані матчі поки що товариські — тому все зникло.
--    Повертаємо ці 4 view до "всі турніри за замовчуванням" (як було до
--    011). Розділення товариських/офіційних тепер робиться інтерфейсом
--    (галочки на /season), а не жорстко на рівні бази.
--
-- 2) Невідповідність цифр "Всі" vs "Товариські": season_stats рахує
--    сезонний рейтинг як середнє, ЗВАЖЕНЕ на хвилини (weighted_season_
--    rating), а стара season_stats_by_competition рахувала ПРОСТЕ
--    середнє (avg(ml.avg_rating)) — звідси різні числа для тих самих
--    матчів. Тепер season_stats_by_competition віддає "сирі" компоненти
--    (сума рейтинг×хвилини, сума хвилин) для КОЖНОГО турніру окремо, щоб
--    фронтенд міг коректно перерахувати зважене середнє для БУДЬ-ЯКОЇ
--    комбінації обраних турнірів (галочки) — і щоб "Всі" завжди збігалось
--    з сумою по всіх турнірах.
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
where m.coach_rating is not null
group by c2.id, c2.name
order by avg_rating desc;

-- Тепер по кожному турніру окремо: "сирі" компоненти замість готового
-- середнього — щоб фронтенд міг сам зважено підсумувати обрані турніри.
create or replace view season_stats_by_competition as
select
  p.id as player_id,
  c.id as competition_id,
  c.slug as competition_slug,
  c.name as competition_name,
  count(ml.id) filter (where ml.avg_rating is not null) as matches_rated,
  sum(ml.goals) as total_goals,
  sum(ml.assists) as total_assists,
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
