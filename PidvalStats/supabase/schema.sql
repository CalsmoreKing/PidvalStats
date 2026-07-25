-- =====================================================================
-- BARÇA RATINGS — SUPABASE SCHEMA
-- Run this in Supabase SQL editor (or via `supabase db push`) once.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TEAMS  (перша команда / Барселона Атлетік)
-- ---------------------------------------------------------------------
create table teams (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- 'first_team' | 'atletic'
  name        text not null,                 -- 'Барселона' | 'Барселона Атлетік'
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- COMPETITIONS
-- ---------------------------------------------------------------------
create table competitions (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- 'friendly' | 'league' | 'cup' | 'ucl'
  name        text not null,                 -- 'Товариський матч' | 'Ла Ліга' | 'Кубок Іспанії' | 'Ліга чемпіонів'
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------
-- PLAYERS
-- ---------------------------------------------------------------------
create table players (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references teams(id) on delete cascade,
  jersey_number    int,                       -- nullable — деякі гравці без номера
  full_name        text not null,
  position         text not null,             -- 'ВРТ','ЦЗ','ЛЗ','ПЗ','ЦОП','ЦП','ЦАП','ЛВ','ПВ','ФРВ'
  nationality      text not null,             -- для прапору
  birth_date       date not null,             -- вік рахуємо на льоту, не зберігаємо
  photo_url        text,                      -- адмін вставляє посилання
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index idx_players_team on players(team_id);

-- Вік завжди рахується на льоту (не зберігається в БД, щоб не бʼючись з ДН)
create or replace view players_with_age as
  select p.*,
         date_part('year', age(current_date, p.birth_date))::int as age
  from players p;

-- ---------------------------------------------------------------------
-- MATCHES
-- ---------------------------------------------------------------------
create type match_status as enum (
  'scheduled',      -- заплановано, ще не почався
  'live',           -- йде зараз
  'finished',       -- зіграний, голосування ще не відкрите
  'voting_open',     -- голосування триває (10 хв)
  'finalized'        -- голосування закрите й підраховане
);

create table matches (
  id                 uuid primary key default gen_random_uuid(),
  team_id            uuid not null references teams(id),
  competition_id     uuid not null references competitions(id),
  opponent_name      text not null,
  opponent_crest_url text,
  is_home            boolean not null default true,
  venue              text,
  referee            text,
  match_date         timestamptz not null,
  status             match_status not null default 'scheduled',
  home_score         int,
  away_score         int,
  voting_opened_at   timestamptz,
  voting_closes_at   timestamptz,             -- = opened_at + 10 хвилин
  mvp_player_id      uuid references players(id),
  coach_rating       numeric(3,1),            -- середня оцінка стартового складу
  notes              text,                    -- вільне поле адміна (травми, підсумок і т.д.)
  created_at         timestamptz not null default now()
);

create index idx_matches_team_date on matches(team_id, match_date desc);
create index idx_matches_status on matches(status);

-- ---------------------------------------------------------------------
-- LINEUPS  (хто грав, скільки хвилин, старт/заміна, капітан)
-- ---------------------------------------------------------------------
create table match_lineups (
  id                    uuid primary key default gen_random_uuid(),
  match_id              uuid not null references matches(id) on delete cascade,
  player_id             uuid not null references players(id),
  is_starting           boolean not null default false,
  is_captain            boolean not null default false,
  minutes_played        int not null default 0,
  sub_in_minute         int,
  sub_out_minute        int,
  goals                 int not null default 0,
  assists               int not null default 0,
  yellow_cards          int not null default 0,
  red_cards             int not null default 0,
  is_injured            boolean not null default false,
  avg_rating            numeric(3,1),          -- заповнюється автоматично при finalize
  unique(match_id, player_id)
);

create index idx_lineups_match on match_lineups(match_id);
create index idx_lineups_player on match_lineups(player_id);

-- ---------------------------------------------------------------------
-- VOTERS  (фанати, що заходять через Telegram)
-- ---------------------------------------------------------------------
create table voters (
  id                uuid primary key default gen_random_uuid(),
  telegram_id       bigint unique not null,
  telegram_username text,
  display_name      text,
  avatar_url        text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- VOTES  (1 голос = 1 voter + 1 match + 1 player, оцінка 1..10)
-- ---------------------------------------------------------------------
create table votes (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references players(id),
  voter_id    uuid not null references voters(id) on delete cascade,
  rating      int not null check (rating between 1 and 10),
  created_at  timestamptz not null default now(),
  unique (match_id, player_id, voter_id)        -- <-- фізично не дає проголосувати двічі
);

create index idx_votes_match_player on votes(match_id, player_id);

-- ---------------------------------------------------------------------
-- MVP VOTES  (окремо від оцінок 1-10: 1 вибір MVP на матч на людину)
-- ---------------------------------------------------------------------
create table mvp_votes (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references players(id),
  voter_id    uuid not null references voters(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (match_id, voter_id)                   -- 1 голос за MVP на матч на людину
);

create index idx_mvp_votes_match_player on mvp_votes(match_id, player_id);

-- ---------------------------------------------------------------------
-- ADMINS  (роль owner/admin, керується власником)
-- ---------------------------------------------------------------------
create type admin_role as enum ('owner', 'admin');

create table admins (
  id           uuid primary key default gen_random_uuid(),
  voter_id     uuid not null references voters(id) on delete cascade,
  role         admin_role not null default 'admin',
  granted_by   uuid references voters(id),
  created_at   timestamptz not null default now(),
  unique(voter_id)
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table players enable row level security;
alter table matches enable row level security;
alter table match_lineups enable row level security;
alter table votes enable row level security;
alter table voters enable row level security;
alter table admins enable row level security;

-- Публічне читання гравців/матчів/складів — сайт публічний
create policy "public read players" on players for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read lineups" on match_lineups for select using (true);

-- Голос: створити можна лише свій, лише поки матч у стані voting_open,
-- і лише один раз (unique constraint вище відсіює дублі).
create policy "voters insert own vote" on votes
  for insert
  with check (
    voter_id = (auth.jwt() ->> 'voter_id')::uuid
    and exists (
      select 1 from matches m
      where m.id = match_id and m.status = 'voting_open'
      and now() < m.voting_closes_at
    )
  );

-- Читати агреговані оцінки можна лише після finalize (рахунок ховаємо під час голосування) —
-- це контролюється на рівні API/фронтенду (не віддаємо avg_rating, поки матч не 'finalized'),
-- RLS тут навмисно відкритий на select, бо middle-layer (API route) вирішує що показати.
create policy "public read votes aggregate only" on votes for select using (false);
-- ^ прямий select з клієнта заборонено; агрегати йдуть лише через серверну функцію нижче.

alter table mvp_votes enable row level security;
create policy "voters insert own mvp vote" on mvp_votes
  for insert
  with check (
    voter_id = (auth.jwt() ->> 'voter_id')::uuid
    and exists (
      select 1 from matches m
      where m.id = match_id and m.status = 'voting_open'
      and now() < m.voting_closes_at
    )
  );
create policy "public read mvp aggregate only" on mvp_votes for select using (false);

-- Адмінські дії (insert/update/delete на matches, players, lineups) — лише для admins
create policy "admins manage matches" on matches
  for all using (exists (
    select 1 from admins a
    join voters v on v.id = a.voter_id
    where v.id = (auth.jwt() ->> 'voter_id')::uuid
  ));

create policy "admins manage players" on players
  for all using (exists (
    select 1 from admins a where a.voter_id = (auth.jwt() ->> 'voter_id')::uuid
  ));

create policy "admins manage lineups" on match_lineups
  for all using (exists (
    select 1 from admins a where a.voter_id = (auth.jwt() ->> 'voter_id')::uuid
  ));

create policy "owner manage admins" on admins
  for all using (exists (
    select 1 from admins a where a.voter_id = (auth.jwt() ->> 'voter_id')::uuid and a.role = 'owner'
  ));

create policy "voters read own row" on voters
  for select using (id = (auth.jwt() ->> 'voter_id')::uuid);

-- =====================================================================
-- FUNCTION: finalize_match — рахує середні, MVP і рейтинг тренера
-- Викликається cron-джобою (pg_cron) точно в voting_closes_at,
-- або Edge Function-таймером, див. supabase/functions/finalize-match.
-- =====================================================================
create or replace function finalize_match(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- проставляємо середню оцінку кожному гравцю зі складу
  update match_lineups ml
  set avg_rating = sub.avg_rating
  from (
    select player_id, round(avg(rating)::numeric, 1) as avg_rating
    from votes
    where match_id = p_match_id
    group by player_id
  ) sub
  where ml.match_id = p_match_id and ml.player_id = sub.player_id;

  -- MVP = гравець з найбільшою кількістю голосів "MVP" (окрема кнопка),
  -- при рівності — вища середня оцінка вирішує
  update matches m
  set mvp_player_id = sub.player_id,
      coach_rating   = (
        select round(avg(ml.avg_rating), 1)
        from match_lineups ml
        where ml.match_id = p_match_id and ml.avg_rating is not null
      ),
      status = 'finalized'
  from (
    select mv.player_id, count(*) as mvp_count, ml.avg_rating
    from mvp_votes mv
    join match_lineups ml on ml.match_id = mv.match_id and ml.player_id = mv.player_id
    where mv.match_id = p_match_id
    group by mv.player_id, ml.avg_rating
    order by mvp_count desc, ml.avg_rating desc nulls last
    limit 1
  ) sub
  where m.id = p_match_id;
end;
$$;

-- =====================================================================
-- VIEW: season_stats — таблиця вкладки "Сезон"
-- Рейтинг зважений за хвилинами: SUM(avg_rating * minutes) / SUM(minutes)
-- =====================================================================
create or replace view season_stats as
select
  p.id as player_id,
  p.full_name,
  p.team_id,
  count(ml.id) filter (where ml.avg_rating is not null) as matches_rated,
  sum(ml.goals) as total_goals,
  sum(ml.assists) as total_assists,
  sum(v.vote_count) as total_votes,
  round(
    sum(ml.avg_rating * ml.minutes_played) filter (where ml.minutes_played > 0)
    / nullif(sum(ml.minutes_played) filter (where ml.minutes_played > 0), 0)
  , 2) as weighted_season_rating
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized'
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id
group by p.id, p.full_name, p.team_id;

-- Розподіл рейтингу по типу турніру (для фільтра в "Сезон")
create or replace view season_stats_by_competition as
select
  p.id as player_id,
  c.slug as competition_slug,
  c.name as competition_name,
  round(avg(ml.avg_rating), 2) as avg_rating,
  count(*) as matches_played
from players p
join match_lineups ml on ml.player_id = p.id
join matches m on m.id = ml.match_id and m.status = 'finalized'
join competitions c on c.id = m.competition_id
where ml.avg_rating is not null
group by p.id, c.slug, c.name;

-- Скільки разів гравець ставав MVP матчу за сезон (для вкладки "Сезон")
create or replace view season_mvp_counts as
select
  p.id as player_id,
  p.full_name,
  count(m.id) as mvp_awards
from players p
join matches m on m.mvp_player_id = p.id and m.status = 'finalized'
group by p.id, p.full_name
order by mvp_awards desc;

-- =====================================================================
-- АВТОЗАКРИТТЯ ГОЛОСУВАННЯ РІВНО ЧЕРЕЗ 10 ХВИЛИН
-- pg_cron доступний на безкоштовному тарифі Supabase
-- (Dashboard → Database → Extensions → увімкнути "pg_cron").
-- Якщо з якоїсь причини не увімкнеться — є резервний варіант:
-- викликати POST /api/admin/tick раз на хвилину через безкоштовний
-- зовнішній cron (напр. cron-job.org). Обидва варіанти виконують
-- ту саму дію — finalize_match() для матчів, де час вийшов.
-- =====================================================================
create extension if not exists pg_cron;

select cron.schedule(
  'auto-finalize-voting',
  '* * * * *',  -- щохвилини
  $$
    select finalize_match(m.id)
    from matches m
    where m.status = 'voting_open' and now() >= m.voting_closes_at;
  $$
);
