-- 037 · Календар 2026/27: бланки матчів + нові турніри
-- ---------------------------------------------------------------------
-- Час береться в поясі того, хто запускає SQL (current_setting('TIMEZONE')).
-- У Supabase SQL Editor це UTC, тому перед запуском переконайся, що стоїть
-- 21:00 за твоїм поясом — або просто відредагуй час у бланках в адмінці.
-- Голосування не вмикається: статус scheduled, voting_* = null.
-- Повторний запуск нічого не дублює (перевірка по даті+супернику).

insert into competitions (slug, name, sort_order, round_label)
values ('supercopa', 'Суперкубок Іспанії', 4, null)
on conflict (slug) do nothing;

begin;

insert into matches (team_id, competition_id, opponent_name, opponent_crest_url, is_home, venue, match_date, status)
select v.team_id, v.competition_id, v.opponent_name, v.opponent_crest_url, v.is_home, v.venue, v.match_date, 'scheduled'
from (values
  ((select id from teams where slug='first_team'), (select id from competitions where slug='friendly'),
   'Бірмінгем', '', false, 'Сент-Ендрюс',
   (date '2026-08-01' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='friendly'),
   'Ноттінгем Форест', '', false, 'Спотіфай Камп Ноу',
   (date '2026-08-08' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Депортіво Ла-Корунья', 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/RC_Deportivo_A_Coru%C3%B1a_logo_2026.svg/250px-RC_Deportivo_A_Coru%C3%B1a_logo_2026.svg.png', false, 'Абанка-Ріасор',
   (date '2026-11-29' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Атлетіко Мадрид', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f9/Atletico_Madrid_Logo_2024.svg/250px-Atletico_Madrid_Logo_2024.svg.png', true, 'Камп Ноу',
   (date '2026-12-02' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Сельта', 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/250px-RC_Celta_de_Vigo_logo.svg.png', true, 'Камп Ноу',
   (date '2026-12-06' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Малага', 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/6d/M%C3%A1laga_CF.svg/250px-M%C3%A1laga_CF.svg.png', false, 'Ла Росаледа',
   (date '2026-12-13' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Реал Сосьєдад', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/250px-Real_Sociedad_logo.svg.png', true, 'Камп Ноу',
   (date '2026-12-20' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Еспаньйол', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/92/RCD_Espanyol_crest.svg/250px-RCD_Espanyol_crest.svg.png', false, 'RCDE Stadium',
   (date '2027-01-03' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Осасуна', 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/38/CA_Osasuna_2024_crest.svg/250px-CA_Osasuna_2024_crest.svg.png', false, 'Ель Садар',
   (date '2027-01-10' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Ельче', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a7/Elche_CF_logo.svg/250px-Elche_CF_logo.svg.png', true, 'Камп Ноу',
   (date '2027-01-17' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Алавес', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f8/Deportivo_Alaves_logo_%282020%29.svg/250px-Deportivo_Alaves_logo_%282020%29.svg.png', false, 'Мендісорроса',
   (date '2027-01-24' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Валенсія', 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/ce/Valenciacf.svg/250px-Valenciacf.svg.png', true, 'Камп Ноу',
   (date '2027-01-31' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Вільярреал', 'https://thumb.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/250px-Villarreal_CF_logo-en.svg.png', false, 'Ла Сераміка',
   (date '2027-02-14' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Леванте', 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg/250px-Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg.png', true, 'Камп Ноу',
   (date '2027-02-21' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Атлетік Більбао', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/250px-Club_Athletic_Bilbao_logo.svg.png', false, 'Сан-Мамес',
   (date '2027-02-28' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Реал Бетіс', 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2f/Real_Betis_2022_logo.svg/250px-Real_Betis_2022_logo.svg.png', true, 'Камп Ноу',
   (date '2027-03-07' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Депортіво Ла-Корунья', 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/RC_Deportivo_A_Coru%C3%B1a_logo_2026.svg/250px-RC_Deportivo_A_Coru%C3%B1a_logo_2026.svg.png', true, 'Камп Ноу',
   (date '2027-03-14' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Райо Вальєкано', 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d8/Rayo_Vallecano_logo.svg/250px-Rayo_Vallecano_logo.svg.png', false, 'Вальєкас',
   (date '2027-03-21' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Севілья', 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/250px-Sevilla_FC_logo.svg.png', true, 'Камп Ноу',
   (date '2027-04-04' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Расінг Сантандер', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f5/Racing_de_Santander_logo.svg/250px-Racing_de_Santander_logo.svg.png', false, 'Ель Сардінеро',
   (date '2027-04-11' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Еспаньйол', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/92/RCD_Espanyol_crest.svg/250px-RCD_Espanyol_crest.svg.png', true, 'Камп Ноу',
   (date '2027-04-18' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Сельта', 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/250px-RC_Celta_de_Vigo_logo.svg.png', false, 'Балаїдос',
   (date '2027-04-21' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Осасуна', 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/38/CA_Osasuna_2024_crest.svg/250px-CA_Osasuna_2024_crest.svg.png', true, 'Камп Ноу',
   (date '2027-05-02' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Реал Мадрид', 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/250px-Real_Madrid_CF.svg.png', false, 'Сантьяго Бернабеу',
   (date '2027-05-09' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Реал Сосьєдад', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/250px-Real_Sociedad_logo.svg.png', false, 'Реале Арена',
   (date '2027-05-16' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Малага', 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/6d/M%C3%A1laga_CF.svg/250px-M%C3%A1laga_CF.svg.png', true, 'Камп Ноу',
   (date '2027-05-23' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='league'),
   'Хетафе', 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/46/Getafe_logo.svg/250px-Getafe_logo.svg.png', false, 'Колісеум',
   (date '2027-05-30' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='ucl'),
   'Манчестер Сіті', 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/250px-Manchester_City_FC_badge.svg.png', true, 'Камп Ноу',
   (date '2026-12-09' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='ucl'),
   'Спортінг Лісабон', '', false, 'Жозе Алваладе',
   (date '2027-01-20' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='ucl'),
   'Комо', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg/250px-Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg.png', true, 'Камп Ноу',
   (date '2027-01-27' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='cup'),
   'Суперник з нижчого дивізіону', '', false, '',
   (date '2026-12-16' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='cup'),
   '1/4 фіналу (якщо пройдемо)', '', false, '',
   (date '2027-02-10' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='cup'),
   '1/2 фіналу, 1-й матч (якщо пройдемо)', '', false, '',
   (date '2027-03-03' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='cup'),
   '1/2 фіналу, 2-й матч (якщо пройдемо)', '', true, '',
   (date '2027-04-07' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='supercopa'),
   'Атлетіко Мадрид', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f9/Atletico_Madrid_Logo_2024.svg/250px-Atletico_Madrid_Logo_2024.svg.png', false, 'Ататюрк, Стамбул',
   (date '2027-02-02' + time '21:00:00') at time zone current_setting('TIMEZONE')),
  ((select id from teams where slug='first_team'), (select id from competitions where slug='supercopa'),
   'Фінал (якщо пройдемо)', '', false, 'Ататюрк, Стамбул',
   (date '2027-02-07' + time '21:00:00') at time zone current_setting('TIMEZONE'))
) as v(team_id, competition_id, opponent_name, opponent_crest_url, is_home, venue, match_date)
where not exists (
  select 1 from matches m
  where m.competition_id = v.competition_id
    and m.opponent_name = v.opponent_name
    and m.match_date::date = v.match_date::date
);

commit;

-- перевірка: має бути 38 турів Ла Ліги, 8 ЛЧ, 4 Кубка, 2 Суперкубка
select c.slug, count(*) total, count(*) filter (where m.status='scheduled') blanks
from matches m join competitions c on c.id = m.competition_id
group by c.slug order by c.slug;
