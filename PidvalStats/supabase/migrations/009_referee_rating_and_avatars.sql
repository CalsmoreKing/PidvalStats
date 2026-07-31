-- =====================================================================
-- МІГРАЦІЯ 009 — оцінка рефері, цікавий факт про гравця в матчі,
-- сховище для аватарок фанатів.
-- =====================================================================

alter table matches add column if not exists referee_rating numeric(3,1);

alter table match_lineups add column if not exists fun_fact text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
