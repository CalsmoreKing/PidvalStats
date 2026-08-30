export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const {
    homeScore,
    awayScore,
    venue,
    refereeId,
    referee,
    coachId,
    coachName,
    matchDate,
    competitionId,
    isCancelled,
    votingOpensAt,
    isExtraTime,
  } = await req.json();
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = {};
  if (homeScore !== undefined) patch.home_score = homeScore == null ? null : Math.max(0, homeScore);
  if (awayScore !== undefined) patch.away_score = awayScore == null ? null : Math.max(0, awayScore);
  if (venue !== undefined) patch.venue = venue;
  if (matchDate !== undefined) patch.match_date = matchDate;
  if (competitionId !== undefined) patch.competition_id = competitionId;
  if (isCancelled !== undefined) patch.is_cancelled = isCancelled;
  if (votingOpensAt !== undefined) patch.voting_opens_at = votingOpensAt || null;
  if (isExtraTime !== undefined) patch.is_extra_time = isExtraTime;

  // Рефері/тренер: або обрали ІСНУЮЧОГО зі списку (refereeId/coachId) —
  // просто підтягуємо ім'я з бази, або вписали НОВОГО (referee/coachName —
  // рядок, ще не порожній undefined) — заводимо новий запис. Перейменування
  // вже наявного тепер робиться виключно у вкладці "Персонал", не тут —
  // раніше пошук завжди йшов ЗА ІМЕНЕМ при кожному збереженні матчу, тому
  // будь-яка зміна тексту створювала ДРУГОГО суддю/тренера.
  async function resolveStaff(table: "referees" | "coaches", id: string | null, name: string | undefined) {
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
  if (refereeId !== undefined || referee !== undefined) {
    const r = await resolveStaff("referees", refereeId || null, referee || undefined);
    patch.referee_id = r.id;
    patch.referee = r.name;
  }
  if (coachId !== undefined || coachName !== undefined) {
    const c = await resolveStaff("coaches", coachId || null, coachName || undefined);
    patch.coach_id = c.id;
    patch.coach_name = c.name;
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
