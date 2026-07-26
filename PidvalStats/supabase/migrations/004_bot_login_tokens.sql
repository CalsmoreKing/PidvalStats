-- =====================================================================
-- МІГРАЦІЯ 004 — таблиця для входу через deep-link у бота замість
-- офіційного Login Widget (який виявився ненадійним — просив телефон
-- і код не приходив навіть у іншого користувача).
--
-- Нова схема входу: браузер отримує одноразовий token, показує посилання
-- t.me/<bot>?start=<token> — людина тицяє "Start" у ВЖЕ залогіненому
-- Telegram (жодного номера телефону чи коду), бот-вебхук підтверджує
-- token, браузер це бачить (polling) і сам ставить сесійну кукі.
-- =====================================================================

create table if not exists login_tokens (
  token             text primary key,
  status            text not null default 'pending', -- 'pending' | 'claimed'
  telegram_id       bigint,
  telegram_username text,
  display_name      text,
  voter_id          uuid references voters(id),
  created_at        timestamptz not null default now()
);

-- Доступ лише через service-role (наш бекенд), тому RLS увімкнено
-- БЕЗ жодної публічної політики — anon/authenticated не бачать нічого.
alter table login_tokens enable row level security;

-- Автоприбирання токенів старших за 10 хв (щоб таблиця не росла вічно)
create index if not exists idx_login_tokens_created on login_tokens(created_at);
