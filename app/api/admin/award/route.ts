export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";
import { autoLinkProposals } from "@/lib/award";

// Один маршрут на всі дії адміна з нагородою: { action, ... }
export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  const body = await req.json();
  const supabase = createServiceClient();
  let error: { message: string } | null = null;

  switch (body.action) {
    case "settings": {
      const s = body.settings ?? {};
      ({ error } = await supabase
        .from("award_settings")
        .update({
          is_open: !!s.is_open,
          show_results: !!s.show_results,
          closes_at: s.closes_at || null,
          registered_before: s.registered_before || null,
          min_matches_voted: Math.max(0, Math.floor(Number(s.min_matches_voted) || 0)),
          min_complete_ratings: Math.max(1, Math.floor(Number(s.min_complete_ratings) || 11)),
          weight_base: Math.max(0, Number(s.weight_base) || 0),
          weight_votes: Math.max(0, Number(s.weight_votes) || 0),
          weight_activity: Math.max(0, Number(s.weight_activity) || 0),
        })
        .eq("id", 1));
      break;
    }
    case "add_nominee": {
      if (!String(body.name ?? "").trim()) return NextResponse.json({ error: "Вкажи ім'я" }, { status: 400 });
      ({ error } = await supabase
        .from("award_nominees")
        .insert({ name: String(body.name).trim(), base_points: Number(body.base_points) || 0, sort_order: 999 }));
      break;
    }
    case "update_nominee": {
      const patch: Record<string, unknown> = {};
      if (body.name !== undefined) patch.name = String(body.name).trim();
      if (body.base_points !== undefined) patch.base_points = Number(body.base_points) || 0;
      if (body.voter_id !== undefined) {
        patch.voter_id = body.voter_id || null;
        if (body.voter_id) {
          // Один акаунт — один номінант: знімаємо з попереднього, якщо був
          await supabase.from("award_nominees").update({ voter_id: null }).eq("voter_id", body.voter_id).neq("id", body.id);
        }
      }
      if (body.is_active !== undefined) patch.is_active = !!body.is_active;
      ({ error } = await supabase.from("award_nominees").update(patch).eq("id", body.id));
      break;
    }
    case "auto_link": {
      // 1) точно за Telegram ID (закрита таблиця), 2) обережно за точним
      // збігом імені. Нічого, що не є однозначним, не чіпаємо.
      const { data: byId } = await supabase.rpc("award_autolink");
      const [{ data: nominees }, { data: voters }] = await Promise.all([
        supabase.from("award_nominees").select("id, name, voter_id, is_active"),
        supabase.from("voters").select("id, display_name, custom_display_name, telegram_username"),
      ]);
      const proposals = autoLinkProposals((nominees ?? []) as any[], (voters ?? []) as any[]);
      for (const p of proposals) {
        await supabase.from("award_nominees").update({ voter_id: p.voterId }).eq("id", p.nomineeId);
      }
      return NextResponse.json({ ok: true, byTelegramId: Number(byId ?? 0), byName: proposals.length });
    }
    case "delete_nominee":
      ({ error } = await supabase.from("award_nominees").delete().eq("id", body.id));
      break;
    case "set_ballot_valid":
      ({ error } = await supabase.from("award_ballots").update({ is_valid: !!body.is_valid }).eq("id", body.id));
      break;
    default:
      return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
