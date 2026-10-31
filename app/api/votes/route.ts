export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

// Оцінка 1–10 із кроком 0.5 (5, 5.5, 6 …)
const validRating = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n >= 1 && n <= 10 && Number.isInteger(n * 2);

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
    if (!r.playerId || !validRating(r.rating)) {
      return NextResponse.json({ error: "Некоректна оцінка" }, { status: 400 });
    }
  }
  if (coachRating !== undefined && coachRating !== null) {
    if (!validRating(coachRating)) {
      return NextResponse.json({ error: "Некоректна оцінка тренера" }, { status: 400 });
    }
  }
  if (refereeRating !== undefined && refereeRating !== null) {
    if (!validRating(refereeRating)) {
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

  // Оцінювати можна лише тих, хто є в складі ЦЬОГО матчу, — інакше можна
  // було б підсунути в голос будь-якого гравця з бази.
  const { data: lineup } = await supabase.from("match_lineups").select("player_id").eq("match_id", matchId);
  const inLineup = new Set((lineup ?? []).map((l: { player_id: string }) => l.player_id));
  if (ratings.some((r: { playerId: string }) => !inLineup.has(r.playerId)) || (mvpPlayerId && !inLineup.has(mvpPlayerId))) {
    return NextResponse.json({ error: "Гравця немає у складі цього матчу" }, { status: 400 });
  }

  const rows = ratings.map((r: { playerId: string; rating: number }) => ({
    match_id: matchId,
    player_id: r.playerId,
    voter_id: voterId,
    rating: r.rating,
  }));

  // Голос можна ЗМІНИТИ, поки голосування відкрите: той самий (матч, гравець,
  // фанат) просто перезаписується — тому onConflict, а не insert. Двічі за
  // одного гравця проголосувати все одно неможливо (unique на рівні БД).
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("match_id", matchId)
    .eq("voter_id", voterId)
    .limit(1);
  const isEdit = (existing ?? []).length > 0;

  const { error: votesError } = await supabase
    .from("votes")
    .upsert(rows, { onConflict: "match_id,player_id,voter_id" });
  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  if (mvpPlayerId) {
    const { error: mvpError } = await supabase
      .from("mvp_votes")
      .upsert({ match_id: matchId, player_id: mvpPlayerId, voter_id: voterId }, { onConflict: "match_id,voter_id" });
    if (mvpError) {
      return NextResponse.json({ ok: true, edited: isEdit, mvpWarning: "MVP-голос не зарахувався" });
    }
  }

  // Тренер і суддя — окремі невеликі таблиці голосів (той самий принцип, що
  // й votes), не блокують основний голос за гравців, якщо матч чомусь без
  // призначеного тренера/судді (coach_id/referee_id null).
  if (coachRating != null && match.coach_id) {
    await supabase
      .from("coach_votes")
      .upsert(
        { match_id: matchId, voter_id: voterId, coach_id: match.coach_id, rating: coachRating },
        { onConflict: "match_id,voter_id" }
      );
  }
  if (refereeRating != null && match.referee_id) {
    await supabase
      .from("referee_votes")
      .upsert(
        { match_id: matchId, voter_id: voterId, referee_id: match.referee_id, rating: refereeRating },
        { onConflict: "match_id,voter_id" }
      );
  }

  return NextResponse.json({ ok: true, edited: isEdit });
}
