import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabase, getVoterIdFromCookie } from "@/lib/supabase/authed";

export async function POST(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійдіть через Telegram, щоб голосувати" }, { status: 401 });
  }

  const { matchId, playerId, rating } = await req.json();

  if (!matchId || !playerId || !rating || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Некоректні дані голосу" }, { status: 400 });
  }

  const supabase = createAuthedSupabase();

  // insert намагається створити голос; unique(match_id, player_id, voter_id) в БД
  // + RLS-політика "voters insert own vote" фізично не дають проголосувати двічі
  // або поза вікном voting_open.
  const { error } = await supabase.from("votes").insert({
    match_id: matchId,
    player_id: playerId,
    voter_id: voterId,
    rating,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ви вже оцінили цього гравця в цьому матчі" }, { status: 409 });
    }
    return NextResponse.json({ error: "Голосування зараз закрите" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
