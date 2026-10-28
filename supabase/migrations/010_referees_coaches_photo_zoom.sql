-- =====================================================================
-- МІГРАЦІЯ 010 — довідники рефері/тренерів (щоб однакові імена не
-- плодились), масштаб фото, підсумкові таблиці оцінок рефері/тренера.
-- =====================================================================

create table if not exists referees (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);
alter table referees enable row level security;
drop policy if exists "public read referees" on referees;
create policy "public read referees" on referees for select using (true);

create table if not exists coaches (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);
alter table coaches enable row level security;
drop policy if exists "public read coaches" on coaches;
create policy "public read coaches" on coaches for select using (true);

alter table matches add column if not exists referee_id uuid references referees(id);
alter table matches add column if not exists coach_id uuid references coaches(id);

alter table players add column if not exists photo_zoom smallint default 100; -- % масштабу фото

-- Підсумкова таблиця оцінок рефері за сезон
create or replace view season_referee_ratings as
select
  r.id as referee_id,
  r.name,
  count(m.id) as matches,
  round(avg(m.referee_rating), 2) as avg_rating
from referees r
join matches m on m.referee_id = r.id and m.status = 'finalized' and not m.is_cancelled
where m.referee_rating is not null
group by r.id, r.name
order by avg_rating desc;

-- Підсумкова таблиця оцінок тренера за сезон
create or replace view season_coach_ratings as
select
  c.id as coach_id,
  c.name,
  count(m.id) as matches,
  round(avg(m.coach_rating), 2) as avg_rating
from coaches c
join matches m on m.coach_id = c.id and m.status = 'finalized' and not m.is_cancelled
where m.coach_rating is not null
group by c.id, c.name
order by avg_rating desc;
