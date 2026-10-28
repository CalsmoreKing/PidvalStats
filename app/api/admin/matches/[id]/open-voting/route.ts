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
  // Рівно 24 години з моменту відкриття — так само, як і в автоматичному
  // відкритті (auto_open_voting, pg_cron).
  const closesAt = votingClosesAt(now);

  const { error } = await supabase
    .from("matches")
    .update({
      status: "voting_open",
      voting_opened_at: now.toISOString(),
      voting_closes_at: closesAt.toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true, closesAt: closesAt.toISOString() });
}
