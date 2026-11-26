-- 036 · Вага голосу, мінімум хвилин для оцінки, хвилини старт/заміни
-- ---------------------------------------------------------------------
-- 1) votes.weight — вага голосу (1.00 / 0.50 / 0.30), ставить тригер.
-- 2) Оцінка матчу = зважене середнє голосів (finalize_match).
-- 3) У сезонних підсумках враховуються лише матчі з >= 25 хвилин.
-- 4) voter_activity отримує quality_matches (матчі без «плоских» голосів).

alter table votes add column if not exists weight numeric(3,2) not null default 1.00;

create or replace function public.rating_min_minutes() returns int
language sql immutable as $$ select 25 $$;

-- вага одного голосу в межах одного матчу
create or replace function public.vote_weight(p_n int, p_min numeric, p_max numeric)
returns numeric
language sql immutable
as $$
  select case
    when p_n >= 8 and p_min = p_max then 0.30::numeric(3,2)
    when p_n >= 8 and (p_max <= 2 or p_min >= 9) then 0.50::numeric(3,2)
    else 1.00::numeric(3,2)
  end
$$;

create or replace function public.trg_votes_weight() returns trigger
language plpgsql security definer
as $$
declare v_n int; v_min numeric; v_max numeric;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  select count(*), min(rating), max(rating) into v_n, v_min, v_max
  from votes where match_id = new.match_id and voter_id = new.voter_id;

  update votes set weight = vote_weight(v_n, v_min, v_max)
  where match_id = new.match_id and voter_id = new.voter_id
    and weight is distinct from vote_weight(v_n, v_min, v_max);
  return null;
end;
$$;

drop trigger if exists votes_weight on votes;
create trigger votes_weight after insert or update of rating on votes
for each row execute function trg_votes_weight();

create or replace function public.recompute_vote_weights(p_match_id uuid default null)
returns int language plpgsql security definer as $$
declare v_count int := 0;
begin
  with agg as (
    select match_id, voter_id, count(*) n, min(rating) mn, max(rating) mx
    from votes where p_match_id is null or match_id = p_match_id
    group by match_id, voter_id
  ), upd as (
    update votes v set weight = vote_weight(a.n, a.mn, a.mx)
    from agg a
    where v.match_id = a.match_id and v.voter_id = a.voter_id
      and v.weight is distinct from vote_weight(a.n, a.mn, a.mx)
    returning 1
  )
  select count(*) into v_count from upd;
  return v_count;
end;
$$;

create or replace function public.finalize_match(p_match_id uuid)
returns void language plpgsql security definer as $$
declare
  v_mvp_player_id uuid; v_match_rating numeric;
  v_coach_rating numeric; v_referee_rating numeric;
begin
  perform recompute_vote_weights(p_match_id);

  update match_lineups ml
  set avg_rating = sub.avg_rating
  from (
    select player_id, round(sum(rating * weight) / nullif(sum(weight), 0), 1) as avg_rating
    from votes where match_id = p_match_id group by player_id
  ) sub
  where ml.match_id = p_match_id and ml.player_id = sub.player_id;

  select mv.player_id into v_mvp_player_id
  from mvp_votes mv
  join match_lineups ml on ml.match_id = mv.match_id and ml.player_id = mv.player_id
  where mv.match_id = p_match_id
  group by mv.player_id, ml.avg_rating
  order by count(*) desc, ml.avg_rating desc nulls last limit 1;

  select round(sum(ml.avg_rating * ml.minutes_played) / nullif(sum(ml.minutes_played), 0), 1)
    into v_match_rating
  from match_lineups ml
  where ml.match_id = p_match_id and ml.avg_rating is not null and ml.minutes_played > 0;

  select round(avg(rating)::numeric, 1) into v_coach_rating from coach_votes where match_id = p_match_id;
  select round(avg(rating)::numeric, 1) into v_referee_rating from referee_votes where match_id = p_match_id;

  update matches set mvp_player_id = v_mvp_player_id, match_rating = v_match_rating,
    coach_rating = coalesce(v_coach_rating, coach_rating),
    referee_rating = coalesce(v_referee_rating, referee_rating), status = 'finalized'
  where id = p_match_id;
end;
$$;

create or replace function public.live_match_ratings(p_match_id uuid)
returns table(player_id uuid, avg_rating numeric, votes bigint)
language sql stable security definer as $$
  select v.player_id, round(sum(v.rating * v.weight) / nullif(sum(v.weight), 0), 1), count(*)
  from votes v where v.match_id = p_match_id group by v.player_id;
$$;

-- season_stats: оцінка лише з матчів >= 25 хв
create or replace view public.season_stats as
select p.id as player_id, p.full_name, p.team_id, p."position", p.nationality,
  p.birth_date, p.jersey_number, p.photo_url,
  count(ml.id) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes()) as matches_rated,
  sum(ml.goals) as total_goals,
  sum(ml.penalty_goals) as total_penalty_goals,
  sum(ml.assists) as total_assists,
  sum(ml.minutes_played) as total_minutes,
  sum(v.vote_count) as total_votes,
  round(sum(ml.avg_rating * ml.minutes_played) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes())
        / nullif(sum(ml.minutes_played) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes()), 0), 2) as weighted_season_rating
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
left join (select match_id, player_id, count(*) as vote_count from votes group by match_id, player_id) v
  on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, p.full_name, p.team_id, p."position", p.nationality, p.birth_date, p.jersey_number, p.photo_url;

create or replace view public.season_stats_by_competition as
select p.id as player_id, c.id as competition_id, c.slug as competition_slug, c.name as competition_name,
  count(ml.id) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes()) as matches_rated,
  sum(ml.goals) as total_goals, sum(ml.penalty_goals) as total_penalty_goals,
  sum(ml.assists) as total_assists, sum(ml.minutes_played) as total_minutes,
  sum(v.vote_count) as total_votes,
  sum(ml.avg_rating * ml.minutes_played) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes()) as rating_weighted_sum,
  sum(ml.minutes_played) filter (where ml.avg_rating is not null and coalesce(ml.minutes_played,0) >= rating_min_minutes()) as minutes_sum,
  sum(ml.minutes_played) filter (where ml.is_starting) as minutes_start,
  sum(ml.minutes_played) filter (where not ml.is_starting) as minutes_sub,
  count(ml.id) as matches_all
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id
left join (select match_id, player_id, count(*) as vote_count from votes group by match_id, player_id) v
  on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, c.id, c.slug, c.name;

-- voter_activity: quality_matches = матчі, де голос не «плоский»
create or replace view public.voter_activity as
with per_match as (
  select voter_id, match_id, count(*) n, min(rating) mn, max(rating) mx, avg(rating) av
  from votes group by 1,2
)
select vt.id as voter_id,
  coalesce(vt.custom_display_name, vt.display_name, vt.telegram_username, 'Фанат') as display_name,
  coalesce(vt.custom_avatar_url, vt.avatar_url) as avatar_url,
  count(distinct pm.match_id) as matches_voted,
  sum(pm.n)::bigint as total_ratings_given,
  round(avg(pm.av), 2) as avg_rating_given,
  count(*) filter (where pm.mn <> pm.mx) as quality_matches,
  round(avg(case when pm.mn = pm.mx then 0 else 1 end), 2) as diversity
from voters vt
join per_match pm on pm.voter_id = vt.id
join matches m on m.id = pm.match_id and m.status = 'finalized'
group by vt.id, vt.custom_display_name, vt.display_name, vt.telegram_username, vt.custom_avatar_url, vt.avatar_url
having sum(pm.n) > 0
order by count(*) filter (where pm.mn <> pm.mx) desc, count(distinct pm.match_id) desc;

-- розрахунок ваг для вже наявних голосів + перерахунок підсумків зіграних матчів
select recompute_vote_weights();
select finalize_match(id) from matches where status = 'finalized' and not is_cancelled;
