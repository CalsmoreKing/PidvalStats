-- 035 · Номери турів: автоприсвоєння + ручне редагування
-- ---------------------------------------------------------------------
-- Правило: рядки з round_locked = true тримають свій номер (це «опорні»).
-- Решта отримує вільні номери в порядку дат. Новий матч без номера стає
-- останнім за датою, тобто фактично «номер ++».
-- Ручна зміна номера: рядок стає locked і займає нову позицію, а всі
-- інші зсуваються, щоб нумерація лишилась суцільною без дублів.

alter table matches add column if not exists round_locked boolean not null default false;

create or replace function public.renumber_match_rounds(p_competition uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_label text;
begin
  select round_label into v_label from competitions where id = p_competition;
  if v_label is null then
    update matches set round_number = null
    where competition_id = p_competition and round_number is not null and not round_locked;
    return;
  end if;

  with m as (
    select id, round_number, round_locked, match_date, created_at
    from matches
    where competition_id = p_competition and not is_cancelled
  ),
  locked as (
    select distinct round_number as rn from m where round_locked and round_number is not null
  ),
  free as (
    select array_agg(gs order by gs) as arr
    from generate_series(1, (select count(*) from m)) gs
    where gs not in (select rn from locked)
  ),
  unl as (
    select id, row_number() over (order by match_date, created_at) as k
    from m
    where not (round_locked and round_number is not null)
  ),
  plan as (
    select u.id, (select f.arr[u.k] from free f) as new_rn from unl u
  )
  update matches mt
  set round_number = plan.new_rn
  from plan
  where mt.id = plan.id and mt.round_number is distinct from plan.new_rn;

  update matches set round_number = null
  where competition_id = p_competition and is_cancelled and round_number is not null and not round_locked;
end;
$$;

create or replace function public.trg_matches_renumber()
returns trigger
language plpgsql
security definer
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  if tg_op = 'INSERT' then
    perform renumber_match_rounds(new.competition_id);
  elsif tg_op = 'DELETE' then
    perform renumber_match_rounds(old.competition_id);
  else
    perform renumber_match_rounds(new.competition_id);
    if new.competition_id is distinct from old.competition_id then
      perform renumber_match_rounds(old.competition_id);
    end if;
  end if;
  return null;
end;
$$;

-- Нічого не фіксуємо наперед: усі наявні тури лишаються автоматичними.
-- Фіксація вмикається лише тоді, коли адмін вписав номер руками.
