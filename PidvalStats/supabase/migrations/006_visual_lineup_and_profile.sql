-- =====================================================================
-- МІГРАЦІЯ 006 — герб клубу, фіксовані слоти формації (усуває накладання
-- гравців), кілька позицій на гравця, ручне кадрування фото, редагування
-- власного профілю фаната.
-- =====================================================================

-- Герб самого клубу (Барселони) — один на весь сайт, не по гравцях
alter table teams add column if not exists crest_url text;

-- Фіксований слот у формації 4-2-3-1 (0..10) — адмін сам розставляє
-- гравців на конкретні позиції в конструкторі складу; це прибирає
-- автоматичне накладання (раніше позиції рахувались евристично).
alter table match_lineups add column if not exists formation_slot smallint;

-- Кілька позицій на гравця (основна лишається в players.position)
alter table players add column if not exists positions text[];

-- Ручне кадрування фото (% від верхнього лівого кута), за замовчуванням центр
alter table players add column if not exists photo_focus_x smallint default 50;
alter table players add column if not exists photo_focus_y smallint default 50;

-- Фанат сам редагує своє відображуване ім'я і аватарку (юзернейм лишається
-- з Telegram, не редагується)
alter table voters add column if not exists custom_display_name text;
alter table voters add column if not exists custom_avatar_url text;
