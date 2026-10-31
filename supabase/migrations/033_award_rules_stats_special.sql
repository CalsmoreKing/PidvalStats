-- =====================================================================
-- МІГРАЦІЯ 033 — «Підвал д'Ор»: остаточні правила, статистика номінантів,
-- спеціальні номінації, автоприв'язка за Telegram ID.
-- Можна запускати повторно.
--
--  • Ваги підсумку: 40% статистика чату, 50% голосування, 10% сайт.
--  • Статистичний бал (0–100) і його розбивка по 5 категоріях — з
--    розрахунку організатора (період 26.10.2025–26.10.2026).
--  • Бал сайту: частка матчів, де фанат поставив повний комплект оцінок
--    (мін. кількість оцінок у комплекті — award_settings.min_complete_ratings).
--  • Telegram ID номінантів лежать в окремій ЗАКРИТІЙ таблиці
--    award_nominee_private (без політик — читає лише service_role) і
--    заливаються окремим файлом, не через цю міграцію.
-- =====================================================================

alter table award_settings add column if not exists min_complete_ratings int not null default 11;
update award_settings set
  title = 'Підвал д''Ор',
  weight_base = 40, weight_votes = 50, weight_activity = 10
where id = 1;
alter table award_settings alter column title set default 'Підвал д''Ор';
alter table award_settings alter column weight_base set default 40;
alter table award_settings alter column weight_votes set default 50;
alter table award_settings alter column weight_activity set default 10;

alter table award_nominees alter column base_points type numeric(8,4);
alter table award_nominees add column if not exists stats jsonb;
alter table award_nominees add column if not exists stat_rank int;

-- Статистика 30 номінантів: оновлюємо за іменем (без урахування регістру
-- й юнікод-варіантів), якщо раптом когось немає — додаємо.
drop table if exists _nom_stats;
create temp table _nom_stats (name text, base numeric, rnk int, stats jsonb);
insert into _nom_stats values
  ('Дін', 97.8560, 1, '{"cats": {"activity": {"total": 32.29, "messages": 12.0, "days": 12.29, "text": 8.0}, "impact": {"total": 40.0, "replies": 17.0, "reactions": 13.0, "people": 10.0}, "dialog": {"total": 15.0, "given": 9.0, "people": 6.0}, "content": {"total": 8.0, "media": 5.0, "long": 3.0}, "quality": {"total": 2.57, "length": 2.0, "reactions": 0.57}}, "raw": {"messages": 146971, "days": 346, "chars": 4308494, "replies_received": 64060, "repliers": 441, "reactions": 20160, "replies_given": 92048, "talked_to": 463, "avg_len": 34.04, "reactions_per_msg": 0.137, "long_msgs": 1420}}'::jsonb),
  ('CalsmoreKing', 94.5640, 2, '{"cats": {"activity": {"total": 32.18, "messages": 11.76, "days": 12.5, "text": 7.91}, "impact": {"total": 37.88, "replies": 17.0, "reactions": 13.0, "people": 7.88}, "dialog": {"total": 13.78, "given": 8.98, "people": 4.8}, "content": {"total": 7.77, "media": 4.94, "long": 2.83}, "quality": {"total": 2.96, "length": 2.0, "reactions": 0.96}}, "raw": {"messages": 48075, "days": 352, "chars": 1477786, "replies_received": 29399, "repliers": 274, "reactions": 9220, "replies_given": 26560, "talked_to": 296, "avg_len": 35.04, "reactions_per_msg": 0.192, "long_msgs": 643}}'::jsonb),
  ('мамонт', 93.2851, 3, '{"cats": {"activity": {"total": 32.64, "messages": 12.0, "days": 12.64, "text": 8.0}, "impact": {"total": 36.9, "replies": 16.7, "reactions": 12.46, "people": 7.74}, "dialog": {"total": 13.85, "given": 9.0, "people": 4.85}, "content": {"total": 7.71, "media": 5.0, "long": 2.71}, "quality": {"total": 2.18, "length": 2.0, "reactions": 0.18}}, "raw": {"messages": 61308, "days": 356, "chars": 1767595, "replies_received": 23977, "repliers": 264, "reactions": 6184, "replies_given": 27241, "talked_to": 303, "avg_len": 32.55, "reactions_per_msg": 0.101, "long_msgs": 494}}'::jsonb),
  ('Влад Гаві', 90.5807, 4, '{"cats": {"activity": {"total": 32.03, "messages": 11.44, "days": 12.96, "text": 7.63}, "impact": {"total": 36.5, "replies": 16.21, "reactions": 12.76, "people": 7.53}, "dialog": {"total": 13.51, "given": 8.73, "people": 4.77}, "content": {"total": 5.44, "media": 3.84, "long": 1.6}, "quality": {"total": 3.1, "length": 2.0, "reactions": 1.1}}, "raw": {"messages": 35736, "days": 365, "chars": 889831, "replies_received": 17880, "repliers": 250, "reactions": 7626, "replies_given": 20060, "talked_to": 293, "avg_len": 26.29, "reactions_per_msg": 0.213, "long_msgs": 38}}'::jsonb),
  ('Yehor', 90.5696, 5, '{"cats": {"activity": {"total": 31.9, "messages": 11.17, "days": 12.93, "text": 7.8}, "impact": {"total": 35.0, "replies": 15.72, "reactions": 11.77, "people": 7.51}, "dialog": {"total": 13.14, "given": 8.66, "people": 4.48}, "content": {"total": 7.99, "media": 4.99, "long": 3.0}, "quality": {"total": 2.55, "length": 2.0, "reactions": 0.55}}, "raw": {"messages": 27854, "days": 364, "chars": 1219875, "replies_received": 13240, "repliers": 249, "reactions": 3803, "replies_given": 18394, "talked_to": 258, "avg_len": 57.27, "reactions_per_msg": 0.137, "long_msgs": 974}}'::jsonb),
  ('Rodion Karakonstantin', 89.9963, 6, '{"cats": {"activity": {"total": 31.49, "messages": 10.81, "days": 12.96, "text": 7.71}, "impact": {"total": 35.28, "replies": 15.73, "reactions": 12.41, "people": 7.14}, "dialog": {"total": 13.18, "given": 8.56, "people": 4.62}, "content": {"total": 6.59, "media": 3.69, "long": 2.9}, "quality": {"total": 3.45, "length": 2.0, "reactions": 1.45}}, "raw": {"messages": 20129, "days": 365, "chars": 1038314, "replies_received": 13354, "repliers": 225, "reactions": 5958, "replies_given": 16526, "talked_to": 274, "avg_len": 53.24, "reactions_per_msg": 0.296, "long_msgs": 767}}'::jsonb),
  ('Vasyl Stanishevskyi', 87.8423, 7, '{"cats": {"activity": {"total": 31.57, "messages": 11.02, "days": 13.0, "text": 7.56}, "impact": {"total": 34.27, "replies": 15.32, "reactions": 11.79, "people": 7.16}, "dialog": {"total": 12.82, "given": 8.35, "people": 4.46}, "content": {"total": 6.37, "media": 4.06, "long": 2.31}, "quality": {"total": 2.81, "length": 2.0, "reactions": 0.81}}, "raw": {"messages": 24296, "days": 366, "chars": 779479, "replies_received": 10452, "repliers": 226, "reactions": 3857, "replies_given": 13048, "talked_to": 256, "avg_len": 34.27, "reactions_per_msg": 0.159, "long_msgs": 197}}'::jsonb),
  ('Neptune', 85.6888, 8, '{"cats": {"activity": {"total": 29.84, "messages": 10.15, "days": 12.15, "text": 7.53}, "impact": {"total": 34.24, "replies": 15.01, "reactions": 12.23, "people": 7.0}, "dialog": {"total": 11.66, "given": 7.75, "people": 3.9}, "content": {"total": 6.29, "media": 3.36, "long": 2.92}, "quality": {"total": 3.66, "length": 2.0, "reactions": 1.66}}, "raw": {"messages": 11009, "days": 342, "chars": 750966, "replies_received": 8664, "repliers": 216, "reactions": 5267, "replies_given": 6592, "talked_to": 196, "avg_len": 69.77, "reactions_per_msg": 0.478, "long_msgs": 803}}'::jsonb),
  ('Anastasia💞', 84.2021, 9, '{"cats": {"activity": {"total": 30.25, "messages": 10.09, "days": 13.0, "text": 7.16}, "impact": {"total": 32.42, "replies": 14.9, "reactions": 10.55, "people": 6.97}, "dialog": {"total": 12.2, "given": 7.88, "people": 4.32}, "content": {"total": 6.56, "media": 3.87, "long": 2.69}, "quality": {"total": 2.78, "length": 2.0, "reactions": 0.78}}, "raw": {"messages": 10335, "days": 366, "chars": 384932, "replies_received": 8077, "repliers": 214, "reactions": 1623, "replies_given": 7626, "talked_to": 240, "avg_len": 43.06, "reactions_per_msg": 0.157, "long_msgs": 471}}'::jsonb),
  ('Ігор', 83.8787, 10, '{"cats": {"activity": {"total": 30.26, "messages": 10.48, "days": 12.64, "text": 7.13}, "impact": {"total": 32.77, "replies": 15.03, "reactions": 11.68, "people": 6.06}, "dialog": {"total": 12.22, "given": 8.22, "people": 4.0}, "content": {"total": 5.36, "media": 3.74, "long": 1.62}, "quality": {"total": 3.27, "length": 2.0, "reactions": 1.27}}, "raw": {"messages": 14869, "days": 356, "chars": 361892, "replies_received": 8724, "repliers": 162, "reactions": 3581, "replies_given": 11200, "talked_to": 206, "avg_len": 28.2, "reactions_per_msg": 0.241, "long_msgs": 40}}'::jsonb),
  ('Dmytro', 83.8197, 11, '{"cats": {"activity": {"total": 29.99, "messages": 10.7, "days": 11.97, "text": 7.31}, "impact": {"total": 32.74, "replies": 14.77, "reactions": 11.54, "people": 6.42}, "dialog": {"total": 12.07, "given": 8.04, "people": 4.03}, "content": {"total": 6.14, "media": 4.01, "long": 2.13}, "quality": {"total": 2.88, "length": 2.0, "reactions": 0.88}}, "raw": {"messages": 18185, "days": 337, "chars": 505422, "replies_received": 7492, "repliers": 182, "reactions": 3252, "replies_given": 9131, "talked_to": 209, "avg_len": 29.92, "reactions_per_msg": 0.179, "long_msgs": 130}}'::jsonb),
  ('𝙲𝚑𝚊𝚔 𝚂', 82.5126, 12, '{"cats": {"activity": {"total": 28.22, "messages": 10.19, "days": 10.44, "text": 7.58}, "impact": {"total": 32.79, "replies": 15.11, "reactions": 11.37, "people": 6.32}, "dialog": {"total": 11.99, "given": 8.13, "people": 3.85}, "content": {"total": 6.19, "media": 3.29, "long": 2.9}, "quality": {"total": 3.33, "length": 2.0, "reactions": 1.33}}, "raw": {"messages": 11378, "days": 294, "chars": 820531, "replies_received": 9185, "repliers": 176, "reactions": 2872, "replies_given": 10138, "talked_to": 191, "avg_len": 75.89, "reactions_per_msg": 0.252, "long_msgs": 761}}'::jsonb),
  ('Maksim', 81.6119, 13, '{"cats": {"activity": {"total": 29.55, "messages": 10.73, "days": 11.76, "text": 7.07}, "impact": {"total": 32.35, "replies": 14.96, "reactions": 10.84, "people": 6.55}, "dialog": {"total": 11.89, "given": 7.85, "people": 4.04}, "content": {"total": 6.08, "media": 4.29, "long": 1.78}, "quality": {"total": 1.74, "length": 1.53, "reactions": 0.21}}, "raw": {"messages": 18649, "days": 331, "chars": 324277, "replies_received": 8372, "repliers": 189, "reactions": 1994, "replies_given": 7391, "talked_to": 210, "avg_len": 19.09, "reactions_per_msg": 0.107, "long_msgs": 58}}'::jsonb),
  ('Макс Лінійчук', 79.3629, 14, '{"cats": {"activity": {"total": 29.08, "messages": 9.44, "days": 12.57, "text": 7.07}, "impact": {"total": 31.08, "replies": 13.92, "reactions": 11.39, "people": 5.77}, "dialog": {"total": 10.89, "given": 7.48, "people": 3.4}, "content": {"total": 4.6, "media": 2.56, "long": 2.03}, "quality": {"total": 3.72, "length": 2.0, "reactions": 1.72}}, "raw": {"messages": 5699, "days": 354, "chars": 326188, "replies_received": 4474, "repliers": 147, "reactions": 2921, "replies_given": 4863, "talked_to": 149, "avg_len": 57.99, "reactions_per_msg": 0.513, "long_msgs": 103}}'::jsonb),
  ('Роман', 79.2536, 15, '{"cats": {"activity": {"total": 28.67, "messages": 9.93, "days": 11.9, "text": 6.84}, "impact": {"total": 30.92, "replies": 14.3, "reactions": 10.87, "people": 5.75}, "dialog": {"total": 10.67, "given": 7.58, "people": 3.09}, "content": {"total": 5.85, "media": 4.15, "long": 1.69}, "quality": {"total": 3.15, "length": 2.0, "reactions": 1.15}}, "raw": {"messages": 8960, "days": 335, "chars": 215088, "replies_received": 5614, "repliers": 146, "reactions": 2024, "replies_given": 5434, "talked_to": 123, "avg_len": 30.64, "reactions_per_msg": 0.226, "long_msgs": 47}}'::jsonb),
  ('Tetiana Rozvadivs''ka ✙🇺🇦', 78.7197, 16, '{"cats": {"activity": {"total": 26.9, "messages": 10.08, "days": 9.91, "text": 6.91}, "impact": {"total": 31.82, "replies": 14.5, "reactions": 10.93, "people": 6.39}, "dialog": {"total": 11.9, "given": 7.73, "people": 4.16}, "content": {"total": 5.09, "media": 3.56, "long": 1.53}, "quality": {"total": 3.02, "length": 1.98, "reactions": 1.04}}, "raw": {"messages": 10300, "days": 279, "chars": 242875, "replies_received": 6336, "repliers": 180, "reactions": 2120, "replies_given": 6457, "talked_to": 223, "avg_len": 24.71, "reactions_per_msg": 0.206, "long_msgs": 32}}'::jsonb),
  ('Rostislav', 75.3859, 17, '{"cats": {"activity": {"total": 28.41, "messages": 9.03, "days": 12.79, "text": 6.59}, "impact": {"total": 28.96, "replies": 12.45, "reactions": 10.41, "people": 6.1}, "dialog": {"total": 10.64, "given": 6.97, "people": 3.67}, "content": {"total": 3.81, "media": 2.84, "long": 0.96}, "quality": {"total": 3.58, "length": 2.0, "reactions": 1.58}}, "raw": {"messages": 3939, "days": 360, "chars": 137780, "replies_received": 1840, "repliers": 164, "reactions": 1471, "replies_given": 2710, "talked_to": 173, "avg_len": 36.42, "reactions_per_msg": 0.373, "long_msgs": 8}}'::jsonb),
  ('Ivan', 73.8584, 18, '{"cats": {"activity": {"total": 25.91, "messages": 9.71, "days": 9.31, "text": 6.9}, "impact": {"total": 29.24, "replies": 13.05, "reactions": 10.06, "people": 6.14}, "dialog": {"total": 10.08, "given": 6.59, "people": 3.49}, "content": {"total": 5.83, "media": 3.57, "long": 2.26}, "quality": {"total": 2.8, "length": 2.0, "reactions": 0.8}}, "raw": {"messages": 7303, "days": 262, "chars": 238270, "replies_received": 2638, "repliers": 166, "reactions": 1151, "replies_given": 1755, "talked_to": 157, "avg_len": 34.76, "reactions_per_msg": 0.158, "long_msgs": 175}}'::jsonb),
  ('Alphahonda', 73.6533, 19, '{"cats": {"activity": {"total": 26.29, "messages": 9.36, "days": 10.3, "text": 6.62}, "impact": {"total": 28.64, "replies": 13.19, "reactions": 10.34, "people": 5.11}, "dialog": {"total": 10.49, "given": 7.22, "people": 3.26}, "content": {"total": 4.88, "media": 3.39, "long": 1.49}, "quality": {"total": 3.36, "length": 2.0, "reactions": 1.36}}, "raw": {"messages": 5320, "days": 290, "chars": 146309, "replies_received": 2872, "repliers": 115, "reactions": 1404, "replies_given": 3622, "talked_to": 137, "avg_len": 31.68, "reactions_per_msg": 0.264, "long_msgs": 29}}'::jsonb),
  ('◇', 72.9544, 20, '{"cats": {"activity": {"total": 26.91, "messages": 9.94, "days": 10.23, "text": 6.74}, "impact": {"total": 29.08, "replies": 12.67, "reactions": 10.2, "people": 6.21}, "dialog": {"total": 10.42, "given": 6.77, "people": 3.65}, "content": {"total": 4.32, "media": 3.14, "long": 1.18}, "quality": {"total": 2.23, "length": 1.64, "reactions": 0.58}}, "raw": {"messages": 9028, "days": 288, "chars": 181371, "replies_received": 2100, "repliers": 170, "reactions": 1272, "replies_given": 2162, "talked_to": 171, "avg_len": 20.54, "reactions_per_msg": 0.141, "long_msgs": 14}}'::jsonb),
  ('a', 71.8553, 21, '{"cats": {"activity": {"total": 23.68, "messages": 9.75, "days": 7.14, "text": 6.79}, "impact": {"total": 29.45, "replies": 13.09, "reactions": 10.22, "people": 6.14}, "dialog": {"total": 11.29, "given": 7.34, "people": 3.95}, "content": {"total": 4.58, "media": 3.34, "long": 1.24}, "quality": {"total": 2.85, "length": 2.0, "reactions": 0.85}}, "raw": {"messages": 7600, "days": 201, "chars": 198417, "replies_received": 2709, "repliers": 166, "reactions": 1291, "replies_given": 4119, "talked_to": 201, "avg_len": 27.67, "reactions_per_msg": 0.17, "long_msgs": 16}}'::jsonb),
  ('Іван Фенікс', 71.8008, 22, '{"cats": {"activity": {"total": 25.9, "messages": 9.78, "days": 9.45, "text": 6.67}, "impact": {"total": 28.41, "replies": 13.65, "reactions": 9.79, "people": 4.97}, "dialog": {"total": 10.51, "given": 7.53, "people": 2.98}, "content": {"total": 4.81, "media": 3.35, "long": 1.46}, "quality": {"total": 2.18, "length": 1.79, "reactions": 0.39}}, "raw": {"messages": 7822, "days": 266, "chars": 157785, "replies_received": 3802, "repliers": 109, "reactions": 949, "replies_given": 5149, "talked_to": 114, "avg_len": 22.38, "reactions_per_msg": 0.121, "long_msgs": 27}}'::jsonb),
  ('Eugene', 70.4004, 23, '{"cats": {"activity": {"total": 24.68, "messages": 8.38, "days": 10.02, "text": 6.29}, "impact": {"total": 27.48, "replies": 11.14, "reactions": 10.74, "people": 5.59}, "dialog": {"total": 10.18, "given": 6.56, "people": 3.62}, "content": {"total": 4.22, "media": 2.62, "long": 1.6}, "quality": {"total": 3.84, "length": 2.0, "reactions": 1.84}}, "raw": {"messages": 2156, "days": 282, "chars": 80285, "replies_received": 834, "repliers": 138, "reactions": 1857, "replies_given": 1696, "talked_to": 169, "avg_len": 39.2, "reactions_per_msg": 0.861, "long_msgs": 38}}'::jsonb),
  ('Brain', 69.4990, 24, '{"cats": {"activity": {"total": 24.82, "messages": 8.46, "days": 9.98, "text": 6.39}, "impact": {"total": 26.56, "replies": 11.76, "reactions": 9.48, "people": 5.32}, "dialog": {"total": 9.68, "given": 6.49, "people": 3.19}, "content": {"total": 4.88, "media": 3.11, "long": 1.77}, "quality": {"total": 3.56, "length": 2.0, "reactions": 1.56}}, "raw": {"messages": 2322, "days": 281, "chars": 95522, "replies_received": 1210, "repliers": 125, "reactions": 768, "replies_given": 1566, "talked_to": 131, "avg_len": 42.64, "reactions_per_msg": 0.331, "long_msgs": 56}}'::jsonb),
  ('𝕹𝖆𝖟𝖆𝖗', 69.1625, 25, '{"cats": {"activity": {"total": 25.86, "messages": 9.04, "days": 10.55, "text": 6.27}, "impact": {"total": 27.02, "replies": 12.04, "reactions": 9.45, "people": 5.53}, "dialog": {"total": 9.55, "given": 6.44, "people": 3.11}, "content": {"total": 4.19, "media": 3.14, "long": 1.05}, "quality": {"total": 2.55, "length": 1.61, "reactions": 0.94}}, "raw": {"messages": 3954, "days": 297, "chars": 77520, "replies_received": 1437, "repliers": 135, "reactions": 748, "replies_given": 1488, "talked_to": 124, "avg_len": 20.18, "reactions_per_msg": 0.189, "long_msgs": 10}}'::jsonb),
  ('Данил', 68.9675, 26, '{"cats": {"activity": {"total": 23.61, "messages": 9.46, "days": 7.64, "text": 6.51}, "impact": {"total": 27.07, "replies": 12.26, "reactions": 9.67, "people": 5.13}, "dialog": {"total": 10.54, "given": 7.08, "people": 3.46}, "content": {"total": 5.02, "media": 3.65, "long": 1.37}, "quality": {"total": 2.73, "length": 2.0, "reactions": 0.73}}, "raw": {"messages": 5842, "days": 215, "chars": 119524, "replies_received": 1646, "repliers": 116, "reactions": 877, "replies_given": 3088, "talked_to": 154, "avg_len": 26.4, "reactions_per_msg": 0.15, "long_msgs": 22}}'::jsonb),
  ('Ян', 68.7863, 27, '{"cats": {"activity": {"total": 23.01, "messages": 8.59, "days": 7.64, "text": 6.78}, "impact": {"total": 27.65, "replies": 12.06, "reactions": 10.24, "people": 5.35}, "dialog": {"total": 9.72, "given": 6.64, "people": 3.08}, "content": {"total": 4.71, "media": 2.42, "long": 2.29}, "quality": {"total": 3.7, "length": 2.0, "reactions": 1.7}}, "raw": {"messages": 2631, "days": 215, "chars": 195310, "replies_received": 1457, "repliers": 126, "reactions": 1304, "replies_given": 1861, "talked_to": 122, "avg_len": 76.03, "reactions_per_msg": 0.496, "long_msgs": 187}}'::jsonb),
  ('ivanna', 68.7266, 28, '{"cats": {"activity": {"total": 25.89, "messages": 8.98, "days": 10.8, "text": 6.1}, "impact": {"total": 26.67, "replies": 12.46, "reactions": 9.5, "people": 4.71}, "dialog": {"total": 10.16, "given": 6.92, "people": 3.24}, "content": {"total": 3.48, "media": 3.17, "long": 0.3}, "quality": {"total": 2.53, "length": 1.47, "reactions": 1.06}}, "raw": {"messages": 3763, "days": 304, "chars": 57533, "replies_received": 1854, "repliers": 98, "reactions": 775, "replies_given": 2573, "talked_to": 135, "avg_len": 18.34, "reactions_per_msg": 0.206, "long_msgs": 1}}'::jsonb),
  ('Kharkivyanin', 68.6620, 29, '{"cats": {"activity": {"total": 19.61, "messages": 9.22, "days": 3.34, "text": 7.05}, "impact": {"total": 29.62, "replies": 13.59, "reactions": 10.79, "people": 5.24}, "dialog": {"total": 9.68, "given": 6.98, "people": 2.7}, "content": {"total": 6.1, "media": 3.57, "long": 2.53}, "quality": {"total": 3.65, "length": 2.0, "reactions": 1.65}}, "raw": {"messages": 4673, "days": 94, "chars": 316116, "replies_received": 3675, "repliers": 121, "reactions": 1922, "replies_given": 2732, "talked_to": 94, "avg_len": 72.8, "reactions_per_msg": 0.411, "long_msgs": 323}}'::jsonb),
  ('GIDROKSIMETILHIROKSILINDIOKSID', 68.3793, 30, '{"cats": {"activity": {"total": 22.49, "messages": 9.69, "days": 6.07, "text": 6.73}, "impact": {"total": 28.11, "replies": 13.19, "reactions": 9.68, "people": 5.24}, "dialog": {"total": 10.59, "given": 7.12, "people": 3.47}, "content": {"total": 4.78, "media": 3.22, "long": 1.55}, "quality": {"total": 2.41, "length": 2.0, "reactions": 0.41}}, "raw": {"messages": 7211, "days": 171, "chars": 176375, "replies_received": 2883, "repliers": 121, "reactions": 881, "replies_given": 3206, "talked_to": 155, "avg_len": 26.29, "reactions_per_msg": 0.122, "long_msgs": 34}}'::jsonb);

update award_nominees n
set base_points = s.base, stats = s.stats, stat_rank = s.rnk, sort_order = s.rnk
from _nom_stats s
where lower(normalize(btrim(n.name), NFKC)) = lower(normalize(btrim(s.name), NFKC));

insert into award_nominees (name, base_points, stats, stat_rank, sort_order)
select s.name, s.base, s.stats, s.rnk, s.rnk
from _nom_stats s
where not exists (
  select 1 from award_nominees n
  where lower(normalize(btrim(n.name), NFKC)) = lower(normalize(btrim(s.name), NFKC))
);

drop table if exists _nom_stats;

-- Закрита таблиця з Telegram ID (лише service_role)
create table if not exists award_nominee_private (
  nominee_id uuid primary key references award_nominees(id) on delete cascade,
  telegram_id bigint not null
);
alter table award_nominee_private enable row level security;

-- Автоприв'язка номінантів до акаунтів сайту за Telegram ID. Точна, тому
-- безпечна: працює й для тих, хто зайде на сайт пізніше (cron кожні 10 хв).
create or replace function award_autolink()
returns int
language plpgsql
security definer
as $$
declare n int;
begin
  update award_nominees a
  set voter_id = v.id
  from award_nominee_private p
  join voters v on v.telegram_id = p.telegram_id
  where p.nominee_id = a.id and a.voter_id is distinct from v.id;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Скільки матчів фанат оцінив ПОВНИМ комплектом (не менше
-- min_complete_ratings оцінок гравців) і скільки матчів було взагалі.
-- Один матч = максимум один зарахований комплект на фаната.
create or replace function award_site_progress()
returns table (voter_id uuid, matches_done bigint, matches_total bigint)
language sql
stable
security definer
as $$
  with total as (
    select count(*) as c from matches where status = 'finalized' and not is_cancelled
  ),
  per_match as (
    select v.voter_id, v.match_id
    from votes v
    join matches m on m.id = v.match_id and m.status = 'finalized' and not m.is_cancelled
    group by v.voter_id, v.match_id
    having count(*) >= coalesce((select min_complete_ratings from award_settings where id = 1), 11)
  )
  select p.voter_id, count(*)::bigint, (select c from total)
  from per_match p
  group by p.voter_id;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function award_autolink() from public, anon, authenticated;
    grant execute on function award_autolink() to service_role;
    revoke all on function award_site_progress() from public, anon, authenticated;
    grant execute on function award_site_progress() to service_role;
  end if;
end $$;

select cron.unschedule(jobid) from cron.job where jobname = 'award-autolink';
select cron.schedule('award-autolink', '*/10 * * * *', $$ select award_autolink(); $$);

-- ---------------------------------------------------------------------
-- Спеціальні номінації (уже вручені)
-- ---------------------------------------------------------------------
create table if not exists award_special (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  emoji text,
  title text not null,
  winner_name text not null,
  stat_score numeric(6,2),
  stats jsonb not null default '[]'::jsonb,   -- [["Підпис","значення"], ...]
  created_at timestamptz not null default now()
);
alter table award_special enable row level security;
drop policy if exists "public read award_special" on award_special;
create policy "public read award_special" on award_special for select using (true);

insert into award_special (sort_order, emoji, title, winner_name, stat_score, stats)
select * from (values
  (1, '🧲', 'МАГНІТ РЕАКЦІЙ', 'Ваня', 68.23, '[["Повідомлень", "1 950"], ["Активних днів", "251"], ["Реакцій отримано", "2 290"], ["Реакцій на повідомлення", "1,17"], ["Відповідей отримано", "1 117"], ["Відповідей надано", "1 765"]]'::jsonb),
  (2, '🧠', 'АНАЛІТИК ПІДВАЛУ', 'Volodymyr Sydorenko', 64.50, '[["Повідомлень", "1 727"], ["Активних днів", "224"], ["Середня довжина повідомлення", "95,66 символу"], ["Повідомлень 200+ символів", "188"], ["Частка довгих повідомлень", "11,0%"], ["Відповідей отримано", "907"], ["Реакцій отримано", "413"]]'::jsonb),
  (3, '🎥', 'КРУЖЕЧКОВИЙ РЕЖИСЕР', 'Уткан', 59.07, '[["Повідомлень", "3 701"], ["Активних днів", "157"], ["Відеоповідомлень", "296"], ["Частка всіх кружечків чату", "47,1%"], ["Загальна тривалість кружечків", "48 хв 22 с"], ["GIF", "842"], ["Відповідей отримано", "983"], ["Реакцій отримано", "349"]]'::jsonb),
  (4, '🎭', 'СТІКЕРМЕЙСТЕР', 'Данил', 68.97, '[["Повідомлень", "5 842"], ["Активних днів", "215"], ["Стікерів", "1 062"], ["Частка стікерів серед повідомлень", "18,2%"], ["GIF", "121"], ["Відповідей отримано", "1 646"], ["Відповідей надано", "3 088"], ["Реакцій отримано", "877"]]'::jsonb),
  (5, '🚀', 'ПРОРИВ РОКУ', 'Kharkivyanin', 68.66, '[["Повідомлень", "4 673"], ["Активних днів", "94"], ["Перше повідомлення у вибірці", "20 липня 2026"], ["Повідомлень на активний день", "49,71"], ["Відповідей отримано", "3 675"], ["Реакцій отримано", "1 922"], ["Опитувань створено", "30"], ["Середня довжина повідомлення", "72,80 символу"], ["Повідомлень 200+ символів", "323"]]'::jsonb),
  (6, '📅', 'ВІЧНА ПРИСУТНІСТЬ', 'Vasyl Stanishevskyi', 87.84, '[["Повідомлень", "24 296"], ["Активних днів", "366 із 366"], ["Відповідей отримано", "10 452"], ["Реакцій отримано", "3 857"], ["Різним людям відповідав", "256"], ["Посилань надіслав", "174"], ["Опитувань створив", "14"]]'::jsonb),
  (7, '📅', 'ВІЧНА ПРИСУТНІСТЬ', 'Anastasia💞', 84.20, '[["Повідомлень", "10 335"], ["Активних днів", "366 із 366"], ["Відповідей отримано", "8 077"], ["Реакцій отримано", "1 623"], ["Різних людей їй відповідали", "214"], ["Різним людям відповідала", "240"], ["Повідомлень 200+ символів", "471"]]'::jsonb),
  (8, '🗳', 'МАЙСТЕР ОПИТУВАНЬ', 'CalsmoreKing', 94.56, '[["Повідомлень", "48 075"], ["Активних днів", "352"], ["Опитувань створено", "36"], ["Відповідей отримано", "29 399"], ["Реакцій отримано", "9 220"]]'::jsonb)
) as v(sort_order, emoji, title, winner_name, stat_score, stats)
where not exists (select 1 from award_special);
