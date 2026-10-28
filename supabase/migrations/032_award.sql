-- =====================================================================
-- МІГРАЦІЯ 032 — «Підвал Д'ор»: нагорода найактивнішому учаснику каналу.
--
-- Номінанти мають БАЗОВІ бали (від організатора), до них додаються:
--   • бали голосування (1 місце = 5 балів … 5 місце = 1 бал), 1 бюлетень
--     на акаунт Telegram, за себе голосувати не можна;
--   • невеликий бонус за активність на сайті (скільки матчів оцінив).
-- Бюлетені закриті для читання (RLS), підсумок рахує сервіс через
-- award_standings() — доступну ЛИШЕ service_role.
-- Можна запускати повторно.
-- =====================================================================

create table if not exists award_settings (
  id int primary key default 1 check (id = 1),
  title text not null default 'Підвал Д''ор',
  is_open boolean not null default false,          -- приймаємо голоси?
  closes_at timestamptz,                           -- автоматичне закриття (необов'язково)
  show_results boolean not null default false,     -- показувати підсумок усім (після закриття)
  min_matches_voted int not null default 0,        -- мін. оцінених матчів, щоб голосувати
  registered_before timestamptz,                   -- акаунт має бути створений ДО цієї дати
  weight_base numeric not null default 55,
  weight_votes numeric not null default 35,
  weight_activity numeric not null default 10
);
insert into award_settings (id) values (1) on conflict do nothing;

create table if not exists award_nominees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_points numeric(6,2) not null default 0,
  voter_id uuid references voters(id) on delete set null, -- акаунт на сайті (для заборони голосу за себе і бонусу)
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists award_ballots (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null unique references voters(id) on delete cascade,
  is_valid boolean not null default true,          -- адмін може відхилити підозрілий бюлетень
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists award_picks (
  ballot_id uuid not null references award_ballots(id) on delete cascade,
  place smallint not null check (place between 1 and 5),
  nominee_id uuid not null references award_nominees(id) on delete cascade,
  primary key (ballot_id, place),
  unique (ballot_id, nominee_id)                   -- не можна двічі за одного
);

alter table award_settings enable row level security;
alter table award_nominees enable row level security;
alter table award_ballots enable row level security;
alter table award_picks enable row level security;
drop policy if exists "public read award_settings" on award_settings;
create policy "public read award_settings" on award_settings for select using (true);
drop policy if exists "public read award_nominees" on award_nominees;
create policy "public read award_nominees" on award_nominees for select using (true);
-- ballots / picks: політик немає навмисно — читає лише service_role

create index if not exists idx_award_picks_nominee on award_picks(nominee_id);

create or replace function award_standings()
returns table (nominee_id uuid, vote_points int, first_places int, ballots int)
language sql
stable
security definer
as $$
  select n.id,
         coalesce(sum(6 - p.place) filter (where b.is_valid), 0)::int,
         (count(*) filter (where b.is_valid and p.place = 1))::int,
         (count(b.id) filter (where b.is_valid))::int
  from award_nominees n
  left join award_picks p on p.nominee_id = n.id
  left join award_ballots b on b.id = p.ballot_id
  group by n.id;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function award_standings() from public, anon, authenticated;
    grant execute on function award_standings() to service_role;
  end if;
end $$;

-- Список номінантів (з базовими балами). Дімона і Яріка прибрано, додано
-- Kharkivyanin і GIDROKSIMETILHIROKSILINDIOKSID.
insert into award_nominees (name, base_points, sort_order)
select v.name, v.base, v.ord from (values
  ('Дін', 97.86, 1),
  ('CalsmoreKing', 94.56, 2),
  ('мамонт', 93.29, 3),
  ('Влад Гаві', 90.58, 4),
  ('Yehor', 90.57, 5),
  ('Rodion Karakonstantin', 90.00, 6),
  ('Vasyl Stanishevskyi', 87.84, 7),
  ('Neptune', 85.69, 8),
  ('Anastasia💞', 84.20, 9),
  ('Ігор', 83.88, 10),
  ('Dmytro', 83.82, 11),
  ('𝙲𝚑𝚊𝚔 𝚂', 82.51, 12),
  ('Maksim', 81.61, 13),
  ('Макс Лінійчук', 79.36, 14),
  ('Роман', 79.25, 15),
  ('Tetiana Rozvadivs''ka ✙🇺🇦', 78.72, 16),
  ('Rostislav', 75.39, 17),
  ('Ivan', 73.86, 18),
  ('Alphahonda', 73.65, 19),
  ('◇', 72.95, 20),
  ('a', 71.86, 21),
  ('Іван Фенікс', 71.80, 22),
  ('Eugene', 70.40, 23),
  ('Brain', 69.50, 24),
  ('𝕹𝖆𝖟𝖆𝖗', 69.16, 25),
  ('Данил', 68.97, 26),
  ('Ян', 68.79, 27),
  ('ivanna', 68.73, 28),
  ('Kharkivyanin', 68.66, 29),
  ('GIDROKSIMETILHIROKSILINDIOKSID', 68.38, 30)
) as v(name, base, ord)
where not exists (select 1 from award_nominees);
