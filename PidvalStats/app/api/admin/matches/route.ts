export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { opponentName, opponentCrestUrl, competitionId, isHome, matchDate, venue, referee, coachName } =
    await req.json();

  if (!opponentName || !competitionId || !matchDate) {
    return NextResponse.json({ error: "Заповни суперника, турнір і дату" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: team } = await supabase.from("teams").select("id").eq("slug", "first_team").single();
  if (!team) {
    return NextResponse.json({ error: "Команду 'first_team' не знайдено в базі" }, { status: 500 });
  }

  // Орієнтовний час відкриття голосування: старт матчу + 90 хв гри + 15 хв перерви.
  // Це лише підказка — адмін відкриває голосування вручну кнопкою, бо реальний
  // час завершення матчу залежить від доданого часу судді.
  const kickoff = new Date(matchDate);
  const suggestedVotingOpensAt = new Date(kickoff.getTime() + 105 * 60_000);

  async function upsertByName(table: "referees" | "coaches", name: string | null) {
    if (!name) return null;
    const { data: existing } = await supabase.from(table).select("id").eq("name", name).maybeSingle();
    if (existing) return existing.id;
    const { data: created } = await supabase.from(table).insert({ name }).select("id").single();
    return created?.id ?? null;
  }
  const refereeId = await upsertByName("referees", referee || null);
  const coachId = await upsertByName("coaches", coachName || null);

  const { data, error } = await supabase
    .from("matches")
    .insert({
      team_id: team.id,
      competition_id: competitionId,
      opponent_name: opponentName,
      opponent_crest_url: opponentCrestUrl || null,
      is_home: isHome,
      match_date: kickoff.toISOString(),
      venue: venue || null,
      referee: referee || null,
      referee_id: refereeId,
      coach_name: coachName || null,
      coach_id: coachId,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    match: data,
    suggestedVotingOpensAt: suggestedVotingOpensAt.toISOString(),
  });
}
