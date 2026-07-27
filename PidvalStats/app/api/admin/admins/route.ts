export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin || admin.role !== "owner") {
    return NextResponse.json({ error: "Лише власник може призначати адмінів" }, { status: 403 });
  }

  const { telegramUsername } = await req.json();
  if (!telegramUsername) {
    return NextResponse.json({ error: "Вкажи юзернейм" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: voter, error: voterError } = await supabase
    .from("voters")
    .select("id")
    .eq("telegram_username", telegramUsername)
    .maybeSingle();

  if (voterError || !voter) {
    return NextResponse.json(
      { error: "Такого користувача не знайдено — можливо, він ще не заходив через Telegram" },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("admins").insert({
    voter_id: voter.id,
    role: "admin",
    granted_by: getVoterIdFromCookie(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ця людина вже адмін" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
