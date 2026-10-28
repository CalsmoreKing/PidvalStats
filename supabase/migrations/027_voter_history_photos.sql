-- =====================================================================
-- МІГРАЦІЯ 027 — voter_vote_history тепер несе фото гравця (для
-- візуального складу на профілі фаната, як на сторінці матчу) і
-- competition_slug (щоб можна було ховати/показувати товариські матчі
-- окремим перемикачем).
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
  c.slug as competition_slug,
  v.player_id,
  p.full_name as player_name,
  p.short_name as player_short_name,
  p.jersey_number,
  p.photo_url,
  p.photo_focus_x,
  p.photo_focus_y,
  p.photo_zoom,
  p.nationality,
  v.rating,
  ml.is_starting,
  exists (
    select 1 from mvp_votes mv
    where mv.voter_id = v.voter_id and mv.match_id = v.match_id and mv.player_id = v.player_id
  ) as is_mvp_pick
from votes v
join matches m on m.id = v.match_id and m.status = 'finalized'
join players p on p.id = v.player_id
join competitions c on c.id = m.competition_id
left join match_lineups ml on ml.match_id = v.match_id and ml.player_id = v.player_id;
