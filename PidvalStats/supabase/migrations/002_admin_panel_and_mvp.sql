-- =====================================================================
-- МІГРАЦІЯ 002 — виконати в Supabase SQL Editor ПІСЛЯ schema.sql + seed_players.sql
-- Написано так, щоб можна було запускати повторно без помилок
-- (create table if not exists, drop policy if exists перед create).
-- =====================================================================

-- Ім'я тренера для конкретного матчу (показується на схемі складу)
alter table matches add column if not exists coach_name text;

-- ---------------------------------------------------------------------
-- teams / competitions ніколи не мали RLS — без цього будь-хто з anon-ключем
-- міг писати в ці таблиці напряму. Вмикаємо, лишаємо читання публічним.
-- ---------------------------------------------------------------------
alter table teams enable row level security;
drop policy if exists "public read teams" on teams;
create policy "public read teams" on teams for select using (true);

alter table competitions enable row level security;
drop policy if exists "public read competitions" on competitions;
create policy "public read competitions" on competitions for select using (true);

-- ---------------------------------------------------------------------
-- MVP VOTES (якщо ще не створено)
-- ---------------------------------------------------------------------
create table if not exists mvp_votes (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references players(id),
  voter_id    uuid not null references voters(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (match_id, voter_id)
);

create index if not exists idx_mvp_votes_match_player on mvp_votes(match_id, player_id);

alter table mvp_votes enable row level security;

drop policy if exists "voters insert own mvp vote" on mvp_votes;
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

drop policy if exists "public read mvp aggregate only" on mvp_votes;
create policy "public read mvp aggregate only" on mvp_votes for select using (false);

-- ---------------------------------------------------------------------
-- Дозволити адміну/власнику читати ВЛАСНИЙ рядок у admins
-- (без цього адмінка не може перевірити "чи я адмін" під RLS)
-- ---------------------------------------------------------------------
drop policy if exists "admins read own row" on admins;
create policy "admins read own row" on admins
  for select using (voter_id = (auth.jwt() ->> 'voter_id')::uuid);

-- Дозволити адмінам шукати фаната по Telegram username, щоб призначити адміном
drop policy if exists "admins read voters" on voters;
create policy "admins read voters" on voters
  for select using (
    exists (select 1 from admins a where a.voter_id = (auth.jwt() ->> 'voter_id')::uuid)
  );

-- ---------------------------------------------------------------------
-- finalize_match — MVP тепер за голосами фанатів (mvp_votes), не за рейтингом
-- ---------------------------------------------------------------------
create or replace function finalize_match(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
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

-- ---------------------------------------------------------------------
-- season_mvp_counts — скільки разів гравець ставав MVP матчу за сезон
-- ---------------------------------------------------------------------
create or replace view season_mvp_counts as
select
  p.id as player_id,
  p.full_name,
  count(m.id) as mvp_awards
from players p
join matches m on m.mvp_player_id = p.id and m.status = 'finalized'
group by p.id, p.full_name
order by mvp_awards desc;

-- ---------------------------------------------------------------------
-- season_stats — додано атрибути гравця, потрібні банерам/таблиці
-- (безпечно: p.id уже в group by, тому інші колонки players можна
-- вибирати без агрегації — функціональна залежність по PK)
-- ---------------------------------------------------------------------
create or replace view season_stats as
select
  p.id as player_id,
  p.full_name,
  p.team_id,
  p.position,
  p.nationality,
  p.birth_date,
  p.jersey_number,
  p.photo_url,
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

-- ---------------------------------------------------------------------
-- pg_cron — автозакриття голосування щохвилини (безпечно на повторний запуск)
-- Якщо розширення pg_cron недоступне на твоєму тарифі — просто пропусти
-- цей блок (закоментуй) і користуйся резервним /api/admin/tick.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('auto-finalize-voting');
exception when others then
  null; -- джоби ще не було — це нормально
end $$;

select cron.schedule(
  'auto-finalize-voting',
  '* * * * *',
  $$
    select finalize_match(m.id)
    from matches m
    where m.status = 'voting_open' and now() >= m.voting_closes_at;
  $$
);
