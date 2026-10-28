export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";
import { isSelfVote, votingIsOpen } from "@/lib/award";

export async function POST(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійди через Telegram, щоб голосувати" }, { status: 401 });
  }
  const { picks } = await req.json();
  if (!Array.isArray(picks) || picks.length !== 5 || picks.some((p) => typeof p !== "string")) {
    return NextResponse.json({ error: "Обери рівно 5 учасників" }, { status: 400 });
  }
  if (new Set(picks).size !== 5) {
    return NextResponse.json({ error: "За однієї людини можна проголосувати лише раз" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const [{ data: settings }, { data: voter }, { data: nominees }, { data: act }] = await Promise.all([
    supabase.from("award_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("voters").select("id, display_name, custom_display_name, telegram_username, created_at").eq("id", voterId).maybeSingle(),
    supabase.from("award_nominees").select("id, name, voter_id, is_active").in("id", picks),
    supabase.from("voter_activity").select("matches_voted").eq("voter_id", voterId).maybeSingle(),
  ]);
  if (!settings || !voter) return NextResponse.json({ error: "Акаунт не знайдено" }, { status: 404 });
  if (!votingIsOpen(settings)) return NextResponse.json({ error: "Голосування зараз закрите" }, { status: 403 });

  if (settings.registered_before && new Date(voter.created_at) > new Date(settings.registered_before)) {
    return NextResponse.json({ error: "Акаунти, створені після початку нагороди, не голосують" }, { status: 403 });
  }
  if ((act?.matches_voted ?? 0) < settings.min_matches_voted) {
    return NextResponse.json(
      { error: `Щоб голосувати, оціни хоча б ${settings.min_matches_voted} матч(ів) на сайті` },
      { status: 403 }
    );
  }

  if (!nominees || nominees.length !== 5 || nominees.some((n: any) => !n.is_active)) {
    return NextResponse.json({ error: "Серед обраних є недійсний номінант" }, { status: 400 });
  }
  const names = [voter.display_name, voter.custom_display_name, voter.telegram_username];
  if (nominees.some((n: any) => isSelfVote(n, { id: voter.id, names }))) {
    return NextResponse.json({ error: "За себе голосувати не можна" }, { status: 400 });
  }

  // Один бюлетень на акаунт; повторне надсилання (до закриття) його замінює.
  // is_valid не чіпаємо — відхилений адміном бюлетень не «воскресає» редагуванням.
  const { data: ballot, error: bErr } = await supabase
    .from("award_ballots")
    .upsert({ voter_id: voterId, updated_at: new Date().toISOString() }, { onConflict: "voter_id" })
    .select("id")
    .single();
  if (bErr || !ballot) return NextResponse.json({ error: bErr?.message ?? "Не вдалось зберегти" }, { status: 500 });

  await supabase.from("award_picks").delete().eq("ballot_id", ballot.id);
  const { error: pErr } = await supabase
    .from("award_picks")
    .insert(picks.map((nominee_id: string, i: number) => ({ ballot_id: ballot.id, place: i + 1, nominee_id })));
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
