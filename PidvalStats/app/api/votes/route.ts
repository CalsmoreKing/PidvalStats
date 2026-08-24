export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійдіть через Telegram, щоб голосувати" }, { status: 401 });
  }

  const { matchId, ratings, mvpPlayerId, coachRating, refereeRating } = await req.json();

  if (!matchId || !Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: "Некоректні дані голосу" }, { status: 400 });
  }
  for (const r of ratings) {
    if (!r.playerId || !Number.isInteger(r.rating) || r.rating < 1 || r.rating > 10) {
      return NextResponse.json({ error: "Некоректна оцінка" }, { status: 400 });
    }
  }
  if (coachRating !== undefined && coachRating !== null) {
    if (!Number.isInteger(coachRating) || coachRating < 1 || coachRating > 10) {
      return NextResponse.json({ error: "Некоректна оцінка тренера" }, { status: 400 });
    }
  }
  if (refereeRating !== undefined && refereeRating !== null) {
    if (!Number.isInteger(refereeRating) || refereeRating < 1 || refereeRating > 10) {
      return NextResponse.json({ error: "Некоректна оцінка судді" }, { status: 400 });
    }
  }

  const supabase = createServiceClient();

  // Голосування дозволене лише поки матч у стані voting_open і час не вийшов —
  // цю перевірку раніше робив RLS, тепер робимо тут явно.
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("status, voting_closes_at, coach_id, referee_id")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return NextResponse.json({ error: "Матч не знайдено" }, { status: 404 });
  }
  if (match.status !== "voting_open" || !match.voting_closes_at || new Date(match.voting_closes_at) < new Date()) {
    return NextResponse.json({ error: "Голосування зараз закрите" }, { status: 403 });
  }

  const rows = ratings.map((r: { playerId: string; rating: number }) => ({
    match_id: matchId,
    player_id: r.playerId,
    voter_id: voterId,
    rating: r.rating,
  }));

  // unique(match_id, player_id, voter_id) на рівні БД фізично не дає
  // проголосувати двічі, незалежно від того, яким ключем виконано insert.
  const { error: votesError } = await supabase.from("votes").insert(rows);
  if (votesError) {
    if (votesError.code === "23505") {
      return NextResponse.json({ error: "Ви вже голосували в цьому матчі" }, { status: 409 });
    }
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  if (mvpPlayerId) {
    const { error: mvpError } = await supabase.from("mvp_votes").insert({
      match_id: matchId,
      player_id: mvpPlayerId,
      voter_id: voterId,
    });
    if (mvpError && mvpError.code !== "23505") {
      return NextResponse.json({ ok: true, mvpWarning: "MVP-голос не зарахувався" });
    }
  }

  // Тренер і суддя — окремі невеликі таблиці голосів (той самий принцип, що
  // й votes), не блокують основний голос за гравців, якщо матч чомусь без
  // призначеного тренера/судді (coach_id/referee_id null).
  if (coachRating != null && match.coach_id) {
    await supabase.from("coach_votes").insert({
      match_id: matchId,
      voter_id: voterId,
      coach_id: match.coach_id,
      rating: coachRating,
    });
  }
  if (refereeRating != null && match.referee_id) {
    await supabase.from("referee_votes").insert({
      match_id: matchId,
      voter_id: voterId,
      referee_id: match.referee_id,
      rating: refereeRating,
    });
  }

  return NextResponse.json({ ok: true });
}
