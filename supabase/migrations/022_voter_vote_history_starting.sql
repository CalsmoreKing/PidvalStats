-- =====================================================================
-- МІГРАЦІЯ 022 — додає is_starting у voter_vote_history, щоб на профілі
-- фаната можна було розкрити матч і побачити "старт" окремо від "лавки".
-- =====================================================================

create or replace view voter_vote_history as
select
  v.voter_id,
  v.match_id,
  m.opponent_name,
  m.match_date,
  m.is_home,
  m.home_score,
  m.away_score,
  v.player_id,
  p.full_name as player_name,
  p.jersey_number,
  v.rating,
  ml.is_starting,
  exists (
    select 1 from mvp_votes mv
    where mv.voter_id = v.voter_id and mv.match_id = v.match_id and mv.player_id = v.player_id
  ) as is_mvp_pick
from votes v
join matches m on m.id = v.match_id and m.status = 'finalized'
join players p on p.id = v.player_id
left join match_lineups ml on ml.match_id = v.match_id and ml.player_id = v.player_id;
