-- =====================================================================
-- МІГРАЦІЯ 034 — півоцінки: фанат може поставити 5.5 (повторний клік по
-- оцінці). Колонки rating у votes, coach_votes, referee_votes стають
-- numeric(3,1) з кроком 0.5 (від 1 до 10).
--
-- Postgres не дозволяє змінити тип колонки, яку читає view
-- (voter_vote_history, voter_activity), тому view спершу знімаємо,
-- змінюємо тип і створюємо точно так само (за pg_get_viewdef).
-- Усе в одній транзакції: якщо щось піде не так — нічого не зміниться.
-- Можна запускати повторно.
-- =====================================================================

do $$
declare
  v record;
  r record;
  t text;
begin
  drop table if exists _views_to_rebuild;
  create temp table _views_to_rebuild as
  select distinct c.oid as view_oid, c.relname as name, pg_get_viewdef(c.oid, true) as def
  from pg_depend d
  join pg_rewrite rw on rw.oid = d.objid
  join pg_class c on c.oid = rw.ev_class and c.relkind = 'v'
  join pg_class tb on tb.oid = d.refobjid and tb.relname in ('votes', 'coach_votes', 'referee_votes')
  join pg_attribute a on a.attrelid = tb.oid and a.attnum = d.refobjsubid and a.attname = 'rating'
  where c.relnamespace = 'public'::regnamespace;

  for v in select name from _views_to_rebuild loop
    execute format('drop view if exists public.%I', v.name);
  end loop;

  foreach t in array array['votes', 'coach_votes', 'referee_votes'] loop
    for r in
      select conname from pg_constraint
      where conrelid = ('public.' || t)::regclass and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%rating%'
    loop
      execute format('alter table public.%I drop constraint %I', t, r.conname);
    end loop;
    execute format('alter table public.%I alter column rating type numeric(3,1) using rating::numeric', t);
    execute format(
      'alter table public.%I add constraint %I check (rating >= 1 and rating <= 10 and (rating * 2) = round(rating * 2))',
      t, t || '_rating_half_step');
  end loop;

  for v in select name, def from _views_to_rebuild loop
    execute format('create view public.%I as %s', v.name, v.def);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('grant select on public.%I to anon, authenticated, service_role', v.name);
    end if;
  end loop;
end $$;
