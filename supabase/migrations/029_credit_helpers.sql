-- =====================================================================
-- МІГРАЦІЯ 029 — "Помічники" для сторінки /credits: люди, яких хочеш
-- показати як тих, хто допомагав (тестувальники, дизайнер тощо), БЕЗ
-- видачі їм доступу до адмінки. Незалежно від admins/voters — просто
-- ім'я й посада, без потреби логінитись через Telegram.
-- =====================================================================

create table if not exists credit_helpers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table credit_helpers enable row level security;
create policy "public read credit_helpers" on credit_helpers for select using (true);
