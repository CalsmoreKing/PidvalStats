export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";
import { votingClosesAt } from "@/lib/voting";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const closesAt = votingClosesAt(now);

  // Повертаємо матч у voting_open — люди можуть доголосувати. Уже зібрані
  // голоси НІКУДИ не діваються (votes/coach_votes/referee_votes/mvp_votes
  // лишаються в базі); avg_rating/match_rating/coach_rating/referee_rating
  // просто перерахуються заново, коли голосування закриють вдруге
  // (finalize_match рахує їх з votes щоразу наново, не додає до старого).
  const { error } = await supabase
    .from("matches")
    .update({
      status: "voting_open",
      voting_closes_at: closesAt.toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, closesAt: closesAt.toISOString() });
}
