-- =====================================================================
-- МІГРАЦІЯ 014 — профіль фаната: історія його голосів по кожному матчу,
-- видима і йому самому, і будь-кому іншому (публічна прозорість голосів,
-- як просив користувач).
--
-- votes/mvp_votes мають RLS `using (false)` — прямий SELECT заборонений
-- усім. Ці view (без security_invoker, той самий принцип, що й season_*)
-- виконуються з правами власника і обходять цю заборону — саме для того,
-- щоб показати конкретні голоси конкретного фаната.
--
-- ВАЖЛИВО: показуємо голоси лише по матчах зі status='finalized' — голоси
-- по матчу, поки голосування ще відкрите, НЕ показуються нікому (навіть
-- самому фанату через цю view), щоб не впливати на інших, хто ще не
-- проголосував.
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
  exists (
    select 1 from mvp_votes mv
    where mv.voter_id = v.voter_id and mv.match_id = v.match_id and mv.player_id = v.player_id
  ) as is_mvp_pick
from votes v
join matches m on m.id = v.match_id and m.status = 'finalized'
join players p on p.id = v.player_id;

-- Список активних фанатів (для сторінки /voters — щоб можна було знайти
-- когось іншого і подивитись його голоси, а не лише свої).
create or replace view voter_activity as
select
  vt.id as voter_id,
  coalesce(vt.custom_display_name, vt.display_name, vt.telegram_username, 'Фанат') as display_name,
  coalesce(vt.custom_avatar_url, vt.avatar_url) as avatar_url,
  count(distinct v.match_id) as matches_voted,
  count(v.id) as total_ratings_given
from voters vt
join votes v on v.voter_id = vt.id
join matches m on m.id = v.match_id and m.status = 'finalized'
group by vt.id, vt.custom_display_name, vt.display_name, vt.telegram_username, vt.custom_avatar_url, vt.avatar_url
having count(v.id) > 0
order by matches_voted desc, total_ratings_given desc;
