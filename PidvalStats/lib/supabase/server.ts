import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Публічне читання (гравці, матчі, статистика) — анонімний ключ, без
// кастомного JWT. { cache: "no-store" } не дає Vercel/Next закешувати
// застарілі дані на "force-dynamic" сторінках.
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}
