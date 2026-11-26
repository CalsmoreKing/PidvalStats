import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Публічне читання (гравці, матчі, статистика) — анонімний ключ, без
// кастомного JWT.
//
// Кеш: публічні дані однакові для всіх, тому fetch іде через Next data cache
// з мітками (tags). Сторінка каже, на скільки їй це кешувати (revalidate),
// а будь-яка дія адміна скидає мітки через revalidateTag — так оновлення
// видно одразу, а звичайний захід не тягне все з Supabase заново.
export const DATA_TAGS = {
  matches: "matches",
  lineups: "lineups",
  players: "players",
  season: "season",
  voters: "voters",
  competitions: "competitions",
  staff: "staff",
  icons: "icons",
} as const;

function tagsForUrl(url: string): string[] {
  const tags: string[] = [];
  if (url.includes("/rest/v1/matches")) tags.push(DATA_TAGS.matches);
  if (url.includes("/rest/v1/match_lineups")) tags.push(DATA_TAGS.lineups, DATA_TAGS.matches);
  if (url.includes("/rest/v1/players")) tags.push(DATA_TAGS.players);
  if (url.includes("/rest/v1/votes") || url.includes("/rest/v1/mvp_votes")) tags.push(DATA_TAGS.season, DATA_TAGS.voters);
  if (url.includes("/rest/v1/season_") || url.includes("/rest/v1/voter_")) tags.push(DATA_TAGS.season, DATA_TAGS.voters);
  if (url.includes("/rest/v1/competitions")) tags.push(DATA_TAGS.competitions);
  if (url.includes("/rest/v1/referees") || url.includes("/rest/v1/coaches")) tags.push(DATA_TAGS.staff);
  if (url.includes("/rest/v1/custom_icons")) tags.push(DATA_TAGS.icons);
  return tags.length > 0 ? tags : [DATA_TAGS.matches];
}

export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
          return fetch(input, { ...init, next: { tags: tagsForUrl(url), revalidate: 30 } } as RequestInit);
        },
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
