-- =====================================================================
-- МІГРАЦІЯ 030 — СПРАВЖНЄ автоматичне відкриття голосування. Раніше
-- voting_opens_at був лише орієнтовним таймером-нагадуванням для адміна
-- (сам факт того, що "має відкритись" ніде не перевірявся автоматично) —
-- звідси й учорашня ситуація, коли голосування не відкрилось само.
--
-- Тепер: pg_cron-джоба щохвилини перевіряє матчі й сама відкриває
-- голосування, щойно минає 90 хв від старту матчу (як на табло) —
-- рівно той самий принцип, що вже працює для auto-finalize-voting.
-- Голосування тепер завжди триває РІВНО 24 години з моменту відкриття
-- (раніше — до 12:00 наступного дня).
-- =====================================================================

create or replace function auto_open_voting()
returns void
language plpgsql
security definer
as $$
begin
  update matches
  set status = 'voting_open',
      voting_opened_at = now(),
      voting_closes_at = now() + interval '24 hours'
  where status = 'scheduled'
    and not is_cancelled
    -- Якщо адмін вручну підправив voting_opens_at для конкретного матчу
    -- (напр. знає, що буде овертайм) — довіряємо йому. Якщо поле порожнє —
    -- запасний варіант рівно 90 хв від старту, як на табло.
    and now() >= coalesce(voting_opens_at, match_date + interval '90 minutes');
end;
$$;

-- На випадок повторного запуску цієї міграції — не плодимо дублі джоби.
select cron.unschedule(jobid) from cron.job where jobname = 'auto-open-voting';

select cron.schedule(
  'auto-open-voting',
  '* * * * *',
  $$ select auto_open_voting(); $$
);
