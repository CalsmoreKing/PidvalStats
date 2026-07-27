-- =====================================================================
-- МІГРАЦІЯ 003 — виправлення "infinite recursion detected in policy for
-- relation admins", яке також валило запити до /matches (через OR'd
-- policy, що торкається admins під час читання matches).
--
-- Причина: політики на matches/players/match_lineups/voters/admins
-- перевіряли права через `exists (select 1 from admins where ...)` —
-- підзапит до admins ЗНОВУ проганяє RLS-політики admins, включно з
-- "owner manage admins", яка сама робить те саме до себе → рекурсія.
--
-- Рішення: SECURITY DEFINER-функції, що читають admins в обхід RLS.
-- =====================================================================

create or replace function is_admin(check_voter_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where voter_id = check_voter_id);
$$;

create or replace function is_owner(check_voter_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where voter_id = check_voter_id and role = 'owner');
$$;

-- ---------------------------------------------------------------------
-- Перевписуємо всі політики, що раніше робили прямий підзапит до admins
-- ---------------------------------------------------------------------
drop policy if exists "admins manage matches" on matches;
create policy "admins manage matches" on matches
  for all using (is_admin((auth.jwt() ->> 'voter_id')::uuid));

drop policy if exists "admins manage players" on players;
create policy "admins manage players" on players
  for all using (is_admin((auth.jwt() ->> 'voter_id')::uuid));

drop policy if exists "admins manage lineups" on match_lineups;
create policy "admins manage lineups" on match_lineups
  for all using (is_admin((auth.jwt() ->> 'voter_id')::uuid));

drop policy if exists "owner manage admins" on admins;
create policy "owner manage admins" on admins
  for all using (is_owner((auth.jwt() ->> 'voter_id')::uuid));

drop policy if exists "admins read voters" on voters;
create policy "admins read voters" on voters
  for select using (is_admin((auth.jwt() ->> 'voter_id')::uuid));

-- "admins read own row" на admins лишається без змін — вона й так
-- не робить підзапит до admins, тому не рекурсивна.
