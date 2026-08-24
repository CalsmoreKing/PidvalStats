-- =====================================================================
-- МІГРАЦІЯ 016 — finalize_match(), версія 3.
--
-- Додає розрахунок match_rating (середнє гравців — те, що раніше сиділо
-- в coach_rating) окремо від coach_rating/referee_rating (тепер середнє
-- зі СПРАВЖНІХ голосів фанатів у coach_votes/referee_votes).
--
-- КРИТИЧНО (пам'ятаємо урок міграції 012): фінальний UPDATE matches
-- робиться БЕЗУМОВНО по id, без FROM-підзапиту, що може повернути 0
-- рядків. Кожне значення рахується ОКРЕМИМ select-into (може дати NULL —
-- це нормально, наприклад якщо ніхто не оцінив суддю), і статус
-- 'finalized' виставляється завжди, незалежно від того, скільки голосів
-- зібралось.
-- =====================================================================

create or replace function finalize_match(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_mvp_player_id uuid;
  v_match_rating numeric;
  v_coach_rating numeric;
  v_referee_rating numeric;
begin
  update match_lineups ml
  set avg_rating = sub.avg_rating
  from (
    select player_id, round(avg(rating)::numeric, 1) as avg_rating
    from votes
    where match_id = p_match_id
    group by player_id
  ) sub
  where ml.match_id = p_match_id and ml.player_id = sub.player_id;

  select mv.player_id into v_mvp_player_id
  from mvp_votes mv
  join match_lineups ml on ml.match_id = mv.match_id and ml.player_id = mv.player_id
  where mv.match_id = p_match_id
  group by mv.player_id, ml.avg_rating
  order by count(*) desc, ml.avg_rating desc nulls last
  limit 1;

  -- Рейтинг МАТЧУ (якість гри команди) — середнє оцінок гравців.
  select round(avg(ml.avg_rating), 1) into v_match_rating
  from match_lineups ml
  where ml.match_id = p_match_id and ml.avg_rating is not null;

  -- Рейтинг ТРЕНЕРА — справжній голос фанатів, окремо від рейтингу матчу.
  select round(avg(rating)::numeric, 1) into v_coach_rating
  from coach_votes where match_id = p_match_id;

  -- Рейтинг СУДДІ — так само справжній голос, а не ручне поле адміна.
  select round(avg(rating)::numeric, 1) into v_referee_rating
  from referee_votes where match_id = p_match_id;

  update matches
  set mvp_player_id = v_mvp_player_id,
      match_rating = v_match_rating,
      coach_rating = coalesce(v_coach_rating, coach_rating),
      referee_rating = coalesce(v_referee_rating, referee_rating),
      status = 'finalized'
  where id = p_match_id;
  -- ^ coalesce на coach/referee: якщо голосів за них не було зовсім,
  -- лишаємо те значення, що вже було (напр. ручно виставлене адміном
  -- раніше) — не затираємо нулем. match_rating так не робимо навмисно:
  -- воно завжди має відображати РЕАЛЬНИЙ стан гравців цього матчу.
end;
$$;
