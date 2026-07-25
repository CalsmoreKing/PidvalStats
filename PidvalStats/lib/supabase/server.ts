import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Після Telegram-логіну наша edge-функція (supabase/functions/telegram-auth)
// підписує JWT з claim'ом voter_id і кладе його в httpOnly cookie "barca_session".
// RLS-політики в schema.sql звіряються саме з (auth.jwt() ->> 'voter_id').
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // сесія виставляється лише через /api/auth/telegram, не тут
        },
        remove() {},
      },
    }
  );
}
