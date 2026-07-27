# Barça Ratings — оцінки фанатів

Сайт для голосування фанатів Барселони за гравців після кожного матчу.
Next.js 14 + Supabase (Postgres, Auth, Storage) + вхід через Telegram-бота
(deep-link, без пароля й без коду), розгортання на Vercel.

## Що вже готово

- Повна структура БД (`supabase/schema.sql` + міграції `002`–`004`):
  гравці, матчі, склади, голоси (фізично неможливо проголосувати двічі),
  MVP-голоси, ролі адмінів, RLS-політики, автопідрахунок після
  голосування, `pg_cron`-джоба на автозакриття.
- Дизайн: чорно-фіолетовий діагональний фон, золоті акценти, банери
  гравців з прапором на фоні.
- Усі сторінки ("Камп Ноу", "Матчі", "Сезон", сторінка матчу) читають
  **реальні дані з Supabase**, не моки.
- Адмін-панель (`/admin`): створення матчу, внесення складу (старт/заміни,
  хвилини, голи/асисти/картки, капітан), кнопка відкриття голосування,
  призначення інших адмінів.
- Форма голосування (кнопки 1–10 + окрема MVP-зірка), одним пакетом.
- **Вхід через Telegram-бота (deep-link)** — замінив офіційний Login
  Widget, який виявився ненадійним (просив телефон, код не приходив).
  Тепер: людина тицяє посилання `t.me/<bot>?start=<token>`, натискає
  "Start" у ВЖЕ залогіненому Telegram — жодного номера чи коду.

## Розгортання

### 1. Supabase
1. Створи проєкт на [supabase.com](https://supabase.com).
2. SQL Editor — виконай по черзі: **`supabase/schema.sql`** →
   **`supabase/seed_players.sql`** → **`supabase/migrations/002_admin_panel_and_mvp.sql`**
   → **`supabase/migrations/003_fix_rls_recursion.sql`** →
   **`supabase/migrations/004_bot_login_tokens.sql`**.
   Усі міграції безпечно перезапускати повторно, якщо не впевнений, що
   саме вже виконував.
3. Database → Extensions → увімкни `pg_cron` (якщо недоступно — див.
   резервний варіант нижче).
4. Project Settings → API — скопіюй `Project URL`, `anon public key`,
   `service_role key`; в JWT Settings — `JWT Secret`.

### 2. Telegram Bot
1. У Telegram відкрий **@BotFather** → `/newbot` → отримай токен
   (`TELEGRAM_BOT_TOKEN`) і юзернейм (`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`,
   без @).
2. **Реєстрація вебхука** (робиться один раз, після деплою на Vercel —
   треба вже знати домен). Встав своє значення в URL і відкрий його в
   браузері (це звичайний GET-запит до Telegram, не наш сайт):
   ```
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<твій-домен>.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```
   `<TELEGRAM_WEBHOOK_SECRET>` — будь-який довгий рядок, який ти сам
   вигадуєш і кладеш і сюди, і в змінну середовища `TELEGRAM_WEBHOOK_SECRET`
   у Vercel. У відповіді має бути `"ok": true`.
3. `/setdomain` для старого Login Widget більше не потрібен — ми його
   не використовуємо.

### 3. Vercel
1. GitHub-репозиторій із цим кодом → підключи до
   [vercel.com](https://vercel.com).
2. Settings → Environment Variables — встав усі значення з `.env.example`
   (Production + Preview; Development можна пропустити).
3. Deploy, потім виконай крок 2.2 вище (реєстрація вебхука) з реальним
   доменом.

### 4. Перший адмін (ти)
Залогінься на сайті через нову кнопку, потім у Supabase SQL Editor:
```sql
insert into admins (voter_id, role)
select id, 'owner' from voters where telegram_username = 'твій_юзернейм';
```
Далі інших адмінів призначаєш просто через `/admin` (розділ "Адміни",
власнику).

### 5. Резервний cron (якщо pg_cron недоступний)
[cron-job.org](https://cron-job.org) (безкоштовно), раз на хвилину на
`POST https://твій-домен.vercel.app/api/admin/tick?token=CRON_SECRET`.

## Ще не зроблено
- Фото гравців і герби суперників — поле `photo_url` / `opponent_crest_url`
  вже є в базі, лишається наповнити (авторське право — джерела шукаєш сам).
- Ідеї з бек-логу (профіль гравця, гістограма голосів, форма гравця, топ
  фанатів, команда сезону, порівняння гравців, шеринг) — заплановано
  після першого успішного живого матчу.

## Локальний запуск
```bash
npm install
cp .env.example .env.local   # заповнити значеннями
npm run dev
```
