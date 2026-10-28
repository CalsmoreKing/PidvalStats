-- =====================================================================
-- МІГРАЦІЯ 020 — додає середню оцінку, яку фанат ставить гравцям, у
-- voter_activity (для колонки в списку "Фанати").
-- =====================================================================

create or replace view voter_activity as
select
  vt.id as voter_id,
  coalesce(vt.custom_display_name, vt.display_name, vt.telegram_username, 'Фанат') as display_name,
  coalesce(vt.custom_avatar_url, vt.avatar_url) as avatar_url,
  count(distinct v.match_id) as matches_voted,
  count(v.id) as total_ratings_given,
  round(avg(v.rating)::numeric, 2) as avg_rating_given
from voters vt
join votes v on v.voter_id = vt.id
join matches m on m.id = v.match_id and m.status = 'finalized'
group by vt.id, vt.custom_display_name, vt.display_name, vt.telegram_username, vt.custom_avatar_url, vt.avatar_url
having count(v.id) > 0
order by matches_voted desc, total_ratings_given desc;
