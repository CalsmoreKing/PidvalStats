import { createClient } from "@supabase/supabase-js";

// service_role повністю обходить RLS — тому саме тут, у коді застосунку,
// а не покладаючись на те, чи Supabase прийме наш власний JWT, і
// перевіряються права (чий це голос, чи адмін і т.д.).
//
// { cache: "no-store" } — обов'язково: і Next.js, і сам Vercel можуть
// кешувати відповіді fetch навіть у "force-dynamic" маршрутах; без цього
// тут можна отримати застарілі дані (саме це й трапилось з логіном).
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
      auth: { persistSession: false },
    }
  );
}
