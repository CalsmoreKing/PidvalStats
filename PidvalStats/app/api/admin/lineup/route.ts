export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

type LineupInput = {
  playerId: string;
  isStarting: boolean;
  isCaptain?: boolean;
  isInjured?: boolean;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  subInMinute?: number | null;
  subOutMinute?: number | null;
  formationSlot?: number | null;
};

// Хвилини рахуємо самі, якщо адмін явно не переписав: гравець, який не
// виходив, відіграв увесь матч.
function computeMinutes(r: LineupInput): number {
  if (r.minutesPlayed != null) return r.minutesPlayed;
  if (r.isStarting) return r.subOutMinute ?? 90;
  return r.subInMinute != null ? Math.max(0, 90 - r.subInMinute) : 0;
}

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { matchId, lineup } = await req.json();
  if (!matchId || !Array.isArray(lineup)) {
    return NextResponse.json({ error: "Некоректні дані складу" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const rows = (lineup as LineupInput[]).map((r) => ({
    match_id: matchId,
    player_id: r.playerId,
    is_starting: r.isStarting,
    is_captain: r.isCaptain ?? false,
    is_injured: r.isInjured ?? false,
    minutes_played: computeMinutes(r),
    goals: r.goals ?? 0,
    assists: r.assists ?? 0,
    yellow_cards: r.yellowCards ?? 0,
    red_cards: r.redCards ?? 0,
    sub_in_minute: r.subInMinute ?? null,
    sub_out_minute: r.subOutMinute ?? null,
    formation_slot: r.formationSlot ?? null,
  }));

  // upsert по унікальному (match_id, player_id) — повторне збереження оновлює, не дублює
  const { error } = await supabase
    .from("match_lineups")
    .upsert(rows, { onConflict: "match_id,player_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  // Прибираємо гравців, яких адмін прибрав зі складу (більше не в поданому списку)
  const keepIds = rows.map((r) => r.player_id);
  const del = supabase.from("match_lineups").delete().eq("match_id", matchId);
  const { error: delError } =
    keepIds.length > 0 ? await del.not("player_id", "in", `(${keepIds.join(",")})`) : await del;

  if (delError) {
    return NextResponse.json({ ok: true, warning: "Склад збережено, але прибирання старих рядків не вдалось" });
  }

  return NextResponse.json({ ok: true });
}
