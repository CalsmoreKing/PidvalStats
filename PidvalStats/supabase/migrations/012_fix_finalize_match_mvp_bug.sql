-- =====================================================================
-- МІГРАЦІЯ 012 — критичний фікс finalize_match().
--
-- БАГ: другий UPDATE matches ... FROM (SELECT ... FROM mvp_votes ...) sub
-- у Postgres не чіпає ЖОДНОГО рядка, якщо підзапит sub повертає 0 рядків
-- (тобто голосів за MVP взагалі не було) — а тоді і status='finalized'
-- ніколи не встановлюється. Помилки при цьому немає, тому pg_cron щохвилини
-- "успішно" відпрацьовує, нічого фактично не роблячи. Саме тому матч
-- Базеля висів вічно в "voting_open".
--
-- ФІКС: MVP і coach_rating рахуємо ОКРЕМИМИ SELECT INTO (можуть дати NULL,
-- це нормально), а сам UPDATE matches ... SET status='finalized' робимо
-- БЕЗУМОВНО по id, без залежності від того, чи є MVP-голоси.
-- =====================================================================

create or replace function finalize_match(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_mvp_player_id uuid;
  v_coach_rating numeric;
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

  -- MVP рахуємо окремо (не в тому ж UPDATE) — щоб відсутність MVP-голосів
  -- не блокувала фіналізацію всього матчу. Якщо голосів нема, буде NULL.
  select mv.player_id into v_mvp_player_id
  from mvp_votes mv
  join match_lineups ml on ml.match_id = mv.match_id and ml.player_id = mv.player_id
  where mv.match_id = p_match_id
  group by mv.player_id, ml.avg_rating
  order by count(*) desc, ml.avg_rating desc nulls last
  limit 1;

  select round(avg(ml.avg_rating), 1) into v_coach_rating
  from match_lineups ml
  where ml.match_id = p_match_id and ml.avg_rating is not null;

  -- Безумовний UPDATE по id — матч завжди переходить у 'finalized',
  -- навіть якщо оцінок чи MVP-голосів не було зовсім.
  update matches
  set mvp_player_id = v_mvp_player_id,
      coach_rating = v_coach_rating,
      status = 'finalized'
  where id = p_match_id;
end;
$$;
