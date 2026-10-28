export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { opponentName, opponentCrestUrl, competitionId, isHome, matchDate, venue, referee, refereeId, coachName, coachId } =
    await req.json();

  if (!opponentName || !competitionId || !matchDate) {
    return NextResponse.json({ error: "Заповни суперника, турнір і дату" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: team } = await supabase.from("teams").select("id").eq("slug", "first_team").single();
  if (!team) {
    return NextResponse.json({ error: "Команду 'first_team' не знайдено в базі" }, { status: 500 });
  }

  // Рівно 90 хв від старту — як на табло матчу. Це вже НЕ просто підказка:
  // якщо адмін не змінить це поле вручну (напр. знає про овертайм), саме
  // за ним pg_cron сам відкриє голосування (auto_open_voting, міграція 030).
  const kickoff = new Date(matchDate);
  const suggestedVotingOpensAt = new Date(kickoff.getTime() + 90 * 60_000);

  // Або обрали ІСНУЮЧОГО (id — просто підтягуємо ім'я з бази), або вписали
  // НОВОГО (name — заводимо новий запис). Раніше завжди йшло через ім'я,
  // тому перейменування в матчі створювало ДРУГОГО суддю/тренера замість
  // редагування наявного.
  async function resolveStaff(table: "referees" | "coaches", id: string | null, name: string | null) {
    if (id) {
      const { data } = await supabase.from(table).select("id, name").eq("id", id).maybeSingle();
      return data ? { id: data.id as string, name: data.name as string } : { id: null, name: null };
    }
    if (name) {
      const { data: existing } = await supabase.from(table).select("id").eq("name", name).maybeSingle();
      if (existing) return { id: existing.id as string, name };
      const { data: created } = await supabase.from(table).insert({ name }).select("id").single();
      return { id: created?.id ?? null, name };
    }
    return { id: null, name: null };
  }
  const refResolved = await resolveStaff("referees", refereeId || null, referee || null);
  const coachResolved = await resolveStaff("coaches", coachId || null, coachName || null);

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
      referee: refResolved.name,
      referee_id: refResolved.id,
      coach_name: coachResolved.name,
      coach_id: coachResolved.id,
      status: "scheduled",
      voting_opens_at: suggestedVotingOpensAt.toISOString(),
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
