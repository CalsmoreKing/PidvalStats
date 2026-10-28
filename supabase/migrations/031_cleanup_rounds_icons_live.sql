-- =====================================================================
-- МІГРАЦІЯ 031 — наведення порядку в базі + нове для сайту.
-- Можна запускати повторно (усе idempotent).
--
--  1. Чистка даних: пробіли в іменах, дублі назв стадіонів, порожні
--     рядки замість NULL, coach_id/referee_id для старих матчів.
--  2. Виправлення голів: у Рафіньї 2 рядки, де пенальті були вписані
--     ОКРЕМО від загальних голів (див. коментар нижче) + CHECK, який
--     більше не дозволить penalty_goals > goals.
--  3. Автонумерація турів (matches.round_number) через тригер.
--  4. Таблиця custom_icons — іконки, які завантажує дизайнер.
--  5. Індекси для швидкості перед промоцією на 4к підписників.
--  6. Агрегати "наживо" та лічильник проголосованих на стороні БД
--     (раніше сайт тягнув усі голоси в JS і впирався в ліміт 1000 рядків).
--  7. View season_player_matches — по рядку на гравця в кожному матчі.
--     Саме з нього таблиця «Сезон» рахує фільтри (турнір, місяць, позиція,
--     старт/заміна) — з сирих цифр, без окремої view під кожен фільтр.
--  8. Автоприбирання застарілих токенів входу (pg_cron).
--  9. Діагностична view match_goals_audit: де голи гравців не збігаються
--     з рахунком матчу.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ЧИСТКА ДАНИХ
-- ---------------------------------------------------------------------

-- Зайві пробіли ("Алехандро Гонсалес " з пробілом у кінці)
update referees set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
  where name is distinct from btrim(regexp_replace(name, '\s+', ' ', 'g'));
update coaches set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
  where name is distinct from btrim(regexp_replace(name, '\s+', ' ', 'g'));
update matches set opponent_name = btrim(regexp_replace(opponent_name, '\s+', ' ', 'g'))
  where opponent_name is distinct from btrim(regexp_replace(opponent_name, '\s+', ' ', 'g'));

-- Порожній рядок '' → NULL (інакше "є значення" у SQL, але порожнє на сайті)
update matches set venue = null where venue is not null and btrim(venue) = '';
update matches set opponent_crest_url = null where opponent_crest_url is not null and btrim(opponent_crest_url) = '';
update teams set crest_url = null where crest_url is not null and btrim(crest_url) = '';
update players set photo_url = null where photo_url is not null and btrim(photo_url) = '';
update referees set photo_url = null where photo_url is not null and btrim(photo_url) = '';
update coaches set photo_url = null where photo_url is not null and btrim(photo_url) = '';
update credit_helpers set photo_url = null where photo_url is not null and btrim(photo_url) = '';

-- Один стадіон — одна назва. Було: "Камп Ноу" ×3 і "Спотіфай Камп Ноу" ×2.
update matches set venue = 'Спотіфай Камп Ноу' where venue = 'Камп Ноу';

-- coach_id / referee_id: прив'язуємо старі матчі за іменем, де це можливо
update matches m set coach_id = c.id
  from coaches c
  where m.coach_id is null and m.coach_name is not null and lower(btrim(m.coach_name)) = lower(c.name);
update matches m set referee_id = r.id
  from referees r
  where m.referee_id is null and m.referee is not null and btrim(m.referee) <> ''
    and lower(btrim(m.referee)) = lower(r.name);

-- matches.referee / coach_name — копія імені для швидкого показу; після
-- чистки узгоджуємо її з довідником (було: "Хосе Луїс Мунуера Монтеро" в
-- матчі проти "Хосе Луїс Монтеро" в довіднику).
update matches m set referee = r.name from referees r
  where m.referee_id = r.id and m.referee is distinct from r.name;
update matches m set coach_name = c.name from coaches c
  where m.coach_id = c.id and m.coach_name is distinct from c.name;

-- Відтепер перейменування судді/тренера в довіднику саме оновлює матчі
create or replace function sync_match_staff_names()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_table_name = 'referees' then
    update matches set referee = new.name where referee_id = new.id;
  else
    update matches set coach_name = new.name where coach_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists referees_sync_names on referees;
create trigger referees_sync_names after update of name on referees
  for each row when (old.name is distinct from new.name) execute function sync_match_staff_names();
drop trigger if exists coaches_sync_names on coaches;
create trigger coaches_sync_names after update of name on coaches
  for each row when (old.name is distinct from new.name) execute function sync_match_staff_names();

-- ---------------------------------------------------------------------
-- 2. ГОЛИ: goals = УСЬОГО голів (разом з пенальті), penalty_goals — лише
--    скільки з них пенальті. Адмін у двох випадках вписав пенальті
--    ОКРЕМО (додатково до голів), тому в таблиці "Сезон" Рафінья мав 5(1)
--    замість 6(1).
-- ---------------------------------------------------------------------

-- Ельче (2026-08-23): рахунок 0:5. Гравці в сумі: 4 голи + 1 пенальті = 5,
-- тобто пенальті вписано поверх голів. Рафінья: 1 гол + 1 пен → 2 голи (1 пен).
update match_lineups ml
set goals = ml.goals + ml.penalty_goals
from matches m,
     (select match_id, sum(goals) as g, sum(penalty_goals) as p from match_lineups group by match_id) s
where m.id = ml.match_id
  and s.match_id = ml.match_id
  and ml.penalty_goals > 0
  and ml.goals = ml.penalty_goals
  and s.g <> case when m.is_home then m.home_score else m.away_score end
  and s.g + s.p = case when m.is_home then m.home_score else m.away_score end;

-- Расінг (2026-09-16): Рафінья мав 1 гол і 2 пенальті — пенальті не може
-- бути більше за голи. Той самий випадок (пенальті вписано поверх): 3 голи (2 пен).
update match_lineups set goals = goals + penalty_goals where penalty_goals > goals;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'match_lineups_penalty_le_goals') then
    alter table match_lineups add constraint match_lineups_penalty_le_goals
      check (penalty_goals <= goals and goals >= 0 and penalty_goals >= 0 and assists >= 0);
  end if;
end $$;

-- Де голи гравців ≠ рахунок Барселони — адмін бачить, що перевірити
-- (автогол суперника або не вписаний бомбардир теж дає розбіжність).
create or replace view match_goals_audit as
select
  m.id as match_id,
  m.match_date,
  m.opponent_name,
  case when m.is_home then m.home_score else m.away_score end as team_goals,
  coalesce(sum(ml.goals), 0) as lineup_goals,
  coalesce(sum(ml.penalty_goals), 0) as lineup_penalty_goals
from matches m
left join match_lineups ml on ml.match_id = m.id
where m.status = 'finalized' and not m.is_cancelled
group by m.id
having coalesce(sum(ml.goals), 0) <> coalesce(case when m.is_home then m.home_score else m.away_score end, 0);

-- ---------------------------------------------------------------------
-- 3. ТУРИ: round_number рахується САМ — за порядком дат у межах турніру,
--    одразу при створенні матчу (в тому числі наперед) і перераховується
--    при зміні дати/турніру, скасуванні чи видаленні матчу.
--    Нумеруються лише турніри з competitions.round_label (Ла Ліга, ЛЧ).
-- ---------------------------------------------------------------------

alter table competitions add column if not exists round_label text;
update competitions set round_label = 'Тур' where slug in ('league', 'ucl') and round_label is null;

alter table matches add column if not exists round_number int;

create or replace function renumber_match_rounds(p_competition uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from competitions where id = p_competition and round_label is not null) then
    update matches set round_number = null where competition_id = p_competition and round_number is not null;
    return;
  end if;

  update matches m
  set round_number = s.rn
  from (
    select id, row_number() over (order by match_date, created_at) as rn
    from matches
    where competition_id = p_competition and not is_cancelled
  ) s
  where m.id = s.id and m.round_number is distinct from s.rn;

  update matches set round_number = null
  where competition_id = p_competition and is_cancelled and round_number is not null;
end;
$$;

create or replace function trg_matches_renumber()
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

drop trigger if exists matches_renumber_ins_del on matches;
create trigger matches_renumber_ins_del after insert or delete on matches
  for each row execute function trg_matches_renumber();
drop trigger if exists matches_renumber_upd on matches;
create trigger matches_renumber_upd after update of match_date, competition_id, is_cancelled on matches
  for each row execute function trg_matches_renumber();

select renumber_match_rounds(id) from competitions;

-- ---------------------------------------------------------------------
-- 4. ІКОНКИ від дизайнера: одна іконка на ключ, завантажується в адмінці
--    (вкладка "Іконки"), застосовується на всьому сайті. Файли лежать у
--    тому ж bucket'і player-photos.
-- ---------------------------------------------------------------------

create table if not exists custom_icons (
  key text primary key check (key in ('goal', 'penalty_goal', 'assist', 'yellow_card', 'red_card')),
  url text not null,
  updated_at timestamptz not null default now()
);
alter table custom_icons enable row level security;
drop policy if exists "public read custom_icons" on custom_icons;
create policy "public read custom_icons" on custom_icons for select using (true);

-- ---------------------------------------------------------------------
-- 5. ІНДЕКСИ
-- ---------------------------------------------------------------------

create index if not exists idx_votes_voter on votes(voter_id);
create index if not exists idx_votes_match_voter on votes(match_id, voter_id);
create index if not exists idx_match_lineups_match on match_lineups(match_id);
create index if not exists idx_match_lineups_player on match_lineups(player_id);
create index if not exists idx_matches_date on matches(match_date desc);
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_matches_competition on matches(competition_id, match_date);
create index if not exists idx_mvp_votes_voter on mvp_votes(voter_id);
create index if not exists idx_login_tokens_created on login_tokens(created_at);

-- ---------------------------------------------------------------------
-- 6. АГРЕГАТИ "НАЖИВО" — рахуємо в БД, а не в JS (PostgREST віддає
--    максимум 1000 рядків за запит; при 4к фанатів ×16 оцінок це б
--    тихо давало неправильні середні).
-- ---------------------------------------------------------------------

create or replace function live_match_ratings(p_match_id uuid)
returns table (player_id uuid, avg_rating numeric, votes bigint)
language sql
stable
security definer
as $$
  select v.player_id, round(avg(v.rating)::numeric, 1), count(*)
  from votes v
  where v.match_id = p_match_id
  group by v.player_id;
$$;

create or replace function live_staff_rating(p_kind text, p_match_id uuid)
returns numeric
language sql
stable
security definer
as $$
  select case p_kind
    when 'coach' then (select round(avg(rating)::numeric, 1) from coach_votes where match_id = p_match_id)
    when 'referee' then (select round(avg(rating)::numeric, 1) from referee_votes where match_id = p_match_id)
  end;
$$;

create or replace function match_voters_count(p_match_id uuid)
returns bigint
language sql
stable
security definer
as $$
  select count(distinct voter_id) from votes where match_id = p_match_id;
$$;

-- ---------------------------------------------------------------------
-- 7. SEASON_PLAYER_MATCHES — один рядок = один гравець в одному матчі.
--    Як і season_stats*, навмисно "security definer" (читає закриті
--    votes лише для кількості голосів завершених матчів).
-- ---------------------------------------------------------------------

create or replace view season_player_matches as
select
  p.id as player_id,
  p.full_name,
  p.team_id,
  p.position,
  m.id as match_id,
  m.match_date,
  c.slug as competition_slug,
  ml.is_starting,
  coalesce(ml.minutes_played, 0) as minutes_played,
  coalesce(ml.goals, 0) as goals,
  coalesce(ml.penalty_goals, 0) as penalty_goals,
  coalesce(ml.assists, 0) as assists,
  ml.avg_rating,
  coalesce(v.vote_count, 0) as votes
from match_lineups ml
join players p on p.id = ml.player_id
join matches m on m.id = ml.match_id and m.status = 'finalized' and not m.is_cancelled
join competitions c on c.id = m.competition_id
left join (
  select match_id, player_id, count(*) as vote_count
  from votes group by match_id, player_id
) v on v.match_id = ml.match_id and v.player_id = ml.player_id;

-- ---------------------------------------------------------------------
-- 8. Токени входу: після входу вони більше не потрібні (сесія живе в
--    cookie). Щодоби прибираємо ті, що старші за 2 доби.
-- ---------------------------------------------------------------------

delete from login_tokens where created_at < now() - interval '2 days';

select cron.unschedule(jobid) from cron.job where jobname = 'cleanup-login-tokens';
select cron.schedule(
  'cleanup-login-tokens',
  '17 3 * * *',
  $$ delete from login_tokens where created_at < now() - interval '2 days'; $$
);

-- ---------------------------------------------------------------------
-- 9. Тривалість голосування — одне місце замість двох: auto_open_voting
--    лишається на 24 години (рішення прийнято), але тепер це окрема
--    функція, яку легко змінити, якщо передумаєш.
-- ---------------------------------------------------------------------

create or replace function voting_duration()
returns interval
language sql
immutable
as $$ select interval '24 hours' $$;

create or replace function auto_open_voting()
returns void
language plpgsql
security definer
as $$
begin
  update matches
  set status = 'voting_open',
      voting_opened_at = now(),
      voting_closes_at = now() + voting_duration()
  where status = 'scheduled'
    and not is_cancelled
    and now() >= coalesce(voting_opens_at, match_date + interval '90 minutes');
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Рейтинги суддів і тренерів — УСІ, хто працював на підсумованих
--     матчах, а не лише ті, за кого вже є голоси (раніше суддя матчу, де
--     ще не було голосування за суддю, мовчки випадав зі списку — звідси
--     «3 судді при 4 матчах»). Без голосів avg_rating = NULL, на сайті «—».
--     Типи колонок ті самі, тож CREATE OR REPLACE безпечний.
-- ---------------------------------------------------------------------

create or replace view season_referee_ratings as
select
  r.id as referee_id,
  r.name,
  count(m.id) as matches,
  round(avg(m.referee_rating), 2) as avg_rating
from referees r
join matches m on m.referee_id = r.id and m.status = 'finalized' and not m.is_cancelled
group by r.id, r.name
order by avg_rating desc nulls last, r.name;

create or replace view season_coach_ratings as
select
  c2.id as coach_id,
  c2.name,
  count(m.id) as matches,
  round(avg(m.coach_rating), 2) as avg_rating
from coaches c2
join matches m on m.coach_id = c2.id and m.status = 'finalized' and not m.is_cancelled
group by c2.id, c2.name
order by avg_rating desc nulls last, c2.name;
