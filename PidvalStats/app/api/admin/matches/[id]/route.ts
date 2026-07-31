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
  if (referee !== undefined) patch.referee = referee;
  if (refereeRating !== undefined) patch.referee_rating = refereeRating;
  if (coachName !== undefined) patch.coach_name = coachName;
  if (coachRating !== undefined) patch.coach_rating = coachRating;
  if (matchDate !== undefined) patch.match_date = matchDate;
  if (competitionId !== undefined) patch.competition_id = competitionId;
  if (isCancelled !== undefined) patch.is_cancelled = isCancelled;

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
