export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const closesAt = new Date(now.getTime() + 30 * 60_000);

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
