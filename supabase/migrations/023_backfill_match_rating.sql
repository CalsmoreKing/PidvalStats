-- =====================================================================
-- МІГРАЦІЯ 023 — одноразове відновлення match_rating для матчів, які
-- закрились ДО міграції 016 (стара finalize_match не рахувала це поле
-- взагалі, тому в них досі NULL). Безпечно виконати повторно — чіпає
-- лише рядки, де match_rating ще не заповнено.
-- =====================================================================

update matches m
set match_rating = (
  select round(avg(ml.avg_rating), 1)
  from match_lineups ml
  where ml.match_id = m.id and ml.avg_rating is not null
)
where m.status = 'finalized' and m.match_rating is null;
