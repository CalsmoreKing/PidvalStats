import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Захищено секретним токеном у query (?token=...), щоб ніхто сторонній
// не міг смикати цей ендпоінт. Постав CRON_SECRET у змінних середовища
// і той самий токен — у налаштуваннях зовнішнього cron-сервісу.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dueMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "voting_open")
    .lte("voting_closes_at", new Date().toISOString());

  for (const m of dueMatches ?? []) {
    await supabase.rpc("finalize_match", { p_match_id: m.id });
  }

  return NextResponse.json({ finalized: dueMatches?.length ?? 0 });
}
