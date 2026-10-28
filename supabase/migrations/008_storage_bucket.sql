-- =====================================================================
-- МІГРАЦІЯ 008 — bucket у Supabase Storage для завантаження фото гравців
-- напряму з адмінки (замість вписування URL вручну).
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

-- Публічне читання файлів з цього bucket (потрібно, щоб фото показувались
-- на сайті); завантаження/видалення — лише через service_role (наш бекенд).
drop policy if exists "public read player photos" on storage.objects;
create policy "public read player photos" on storage.objects
  for select using (bucket_id = 'player-photos');
