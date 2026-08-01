export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { homeScore, awayScore, venue, referee, refereeRating, coachName, coachRating, matchDate, competitionId, isCancelled } =
    await req.json();
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = {};
  if (homeScore !== undefined) patch.home_score = homeScore == null ? null : Math.max(0, homeScore);
  if (awayScore !== undefined) patch.away_score = awayScore == null ? null : Math.max(0, awayScore);
  if (venue !== undefined) patch.venue = venue;
  if (refereeRating !== undefined) patch.referee_rating = refereeRating;
  if (coachRating !== undefined) patch.coach_rating = coachRating;
  if (matchDate !== undefined) patch.match_date = matchDate;
  if (competitionId !== undefined) patch.competition_id = competitionId;
  if (isCancelled !== undefined) patch.is_cancelled = isCancelled;

  // Рефері/тренер: шукаємо за іменем у довіднику (щоб однакове ім'я не
  // плодило дублі в підсумкових таблицях), створюємо, якщо ще нема.
  if (referee !== undefined) {
    patch.referee = referee;
    if (referee) {
      const { data: existing } = await supabase.from("referees").select("id").eq("name", referee).maybeSingle();
      const refId = existing?.id ?? (await supabase.from("referees").insert({ name: referee }).select("id").single()).data?.id;
      patch.referee_id = refId ?? null;
    } else {
      patch.referee_id = null;
    }
  }
  if (coachName !== undefined) {
    patch.coach_name = coachName;
    if (coachName) {
      const { data: existing } = await supabase.from("coaches").select("id").eq("name", coachName).maybeSingle();
      const coachId = existing?.id ?? (await supabase.from("coaches").insert({ name: coachName }).select("id").single()).data?.id;
      patch.coach_id = coachId ?? null;
    } else {
      patch.coach_id = null;
    }
  }

  const { error } = await supabase.from("matches").update(patch).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const supabase = createServiceClient();
  // match_lineups/votes/mvp_votes мають on delete cascade від matches — досить видалити сам матч
  const { error } = await supabase.from("matches").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
