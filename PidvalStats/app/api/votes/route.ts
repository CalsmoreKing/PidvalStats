import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabase, getVoterIdFromCookie } from "@/lib/supabase/authed";

// Приймає ОДРАЗУ весь пакет голосів фаната за матч (весь стартовий склад +
// заміни за один раз) + окремо, опційно, вибір MVP. Так гарантується, що
// "проголосував" рахується як один завершений акт, а не по гравцю окремо —
// саме так, як просив Еліас для лічильника голосів наживо.
export async function POST(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійдіть через Telegram, щоб голосувати" }, { status: 401 });
  }

  const { matchId, ratings, mvpPlayerId } = await req.json();
  // ratings: [{ playerId, rating }], rating 1..10 ціле

  if (!matchId || !Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: "Некоректні дані голосу" }, { status: 400 });
  }
  for (const r of ratings) {
    if (!r.playerId || !Number.isInteger(r.rating) || r.rating < 1 || r.rating > 10) {
      return NextResponse.json({ error: "Некоректна оцінка" }, { status: 400 });
    }
  }

  const supabase = createAuthedSupabase();

  const rows = ratings.map((r: { playerId: string; rating: number }) => ({
    match_id: matchId,
    player_id: r.playerId,
    voter_id: voterId,
    rating: r.rating,
  }));

  // unique(match_id, player_id, voter_id) в БД + RLS "voters insert own vote"
  // фізично не дають проголосувати двічі або поза вікном voting_open.
  const { error: votesError } = await supabase.from("votes").insert(rows);
  if (votesError) {
    if (votesError.code === "23505") {
      return NextResponse.json({ error: "Ви вже голосували в цьому матчі" }, { status: 409 });
    }
    return NextResponse.json({ error: "Голосування зараз закрите" }, { status: 403 });
  }

  if (mvpPlayerId) {
    const { error: mvpError } = await supabase.from("mvp_votes").insert({
      match_id: matchId,
      player_id: mvpPlayerId,
      voter_id: voterId,
    });
    if (mvpError && mvpError.code !== "23505") {
      // сам голос за гравців уже зарахований, MVP — другорядний, не валимо весь запит
      return NextResponse.json({ ok: true, mvpWarning: "MVP-голос не зарахувався" });
    }
  }

  return NextResponse.json({ ok: true });
}
