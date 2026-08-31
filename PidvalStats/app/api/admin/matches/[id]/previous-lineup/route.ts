export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("matches")
    .select("match_date")
    .eq("id", params.id)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ slots: [] });
  }

  // ВАЖЛИВО: раніше тут просто брався найновіший ІНШИЙ матч у базі, без
  // фільтра "раніше за датою поточного" — тому якщо вже створено наступний
  // матч (пізніша дата), редагування ЗАВЕРШЕНОГО матчу підтягувало не той
  // склад (або порожній, бо в майбутнього матчу лінійки ще нема).
  const { data: prevMatch } = await supabase
    .from("matches")
    .select("id")
    .lt("match_date", current.match_date)
    .order("match_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prevMatch) {
    return NextResponse.json({ slots: [] });
  }

  const { data: rows } = await supabase
    .from("match_lineups")
    .select("player_id, formation_slot")
    .eq("match_id", prevMatch.id)
    .eq("is_starting", true)
    .not("formation_slot", "is", null);

  return NextResponse.json({ slots: rows ?? [] });
}
