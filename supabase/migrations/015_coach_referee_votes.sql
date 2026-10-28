-- =====================================================================
-- МІГРАЦІЯ 015 — суддя й тренер отримують СПРАВЖНІ голоси фанатів (0-10,
-- як у гравців), а "оцінка матчу" відв'язується від оцінки тренера.
--
-- Було: matches.coach_rating рахувався як середнє оцінок ГРАВЦІВ (тобто
-- насправді це була оцінка МАТЧУ, просто під невірною назвою) і
-- використовувався для сортування "топ матчів". matches.referee_rating
-- вводив адмін вручну — це теж не був голос фанатів.
--
-- Стало: matches.match_rating — нове поле, середнє оцінок гравців (те, що
-- раніше називалось coach_rating) — саме воно тепер керує "топ матчами".
-- matches.coach_rating і matches.referee_rating — тепер СПРАВЖНІ середні
-- з нових таблиць голосів coach_votes / referee_votes (той самий принцип,
-- що й votes для гравців: один голос на фаната на матч, RLS замкнений на
-- select, вставка лише через сервісний API-роут).
-- =====================================================================

alter table matches add column if not exists match_rating numeric(3,1);

alter table referees add column if not exists photo_url text;
alter table coaches add column if not exists photo_url text;

create table if not exists coach_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  voter_id uuid not null references voters(id) on delete cascade,
  coach_id uuid not null references coaches(id),
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  unique (match_id, voter_id)
);
alter table coach_votes enable row level security;
create policy "public read coach votes aggregate only" on coach_votes for select using (false);
create policy "voters insert own coach vote" on coach_votes
  for insert
  with check (
    voter_id = (auth.jwt() ->> 'voter_id')::uuid
    and exists (
      select 1 from matches m
      where m.id = match_id and m.status = 'voting_open' and now() < m.voting_closes_at
    )
  );
-- ^ ця RLS-політика — підстраховка на випадок прямого клієнтського insert;
-- реальна вставка йде через /api/votes на сервісному ключі, де перевірка
-- робиться явно в коді (той самий підхід, що й для votes/mvp_votes).

create table if not exists referee_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  voter_id uuid not null references voters(id) on delete cascade,
  referee_id uuid not null references referees(id),
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  unique (match_id, voter_id)
);
alter table referee_votes enable row level security;
create policy "public read referee votes aggregate only" on referee_votes for select using (false);
create policy "voters insert own referee vote" on referee_votes
  for insert
  with check (
    voter_id = (auth.jwt() ->> 'voter_id')::uuid
    and exists (
      select 1 from matches m
      where m.id = match_id and m.status = 'voting_open' and now() < m.voting_closes_at
    )
  );
