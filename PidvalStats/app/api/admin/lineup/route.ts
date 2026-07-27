export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

type LineupInput = {
  playerId: string;
  isStarting: boolean;
  isCaptain?: boolean;
  isInjured?: boolean;
  minutesPlayed: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
};

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
    minutes_played: r.minutesPlayed ?? 0,
    goals: r.goals ?? 0,
    assists: r.assists ?? 0,
    yellow_cards: r.yellowCards ?? 0,
    red_cards: r.redCards ?? 0,
  }));

  // upsert по унікальному (match_id, player_id) — повторне збереження оновлює, не дублює
  const { error } = await supabase
    .from("match_lineups")
    .upsert(rows, { onConflict: "match_id,player_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
