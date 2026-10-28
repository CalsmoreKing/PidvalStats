export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійдіть через Telegram" }, { status: 401 });
  }

  const { displayName, avatarUrl, showRatings } = await req.json();
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = {
    custom_display_name: displayName || null,
    custom_avatar_url: avatarUrl || null,
  };
  if (showRatings !== undefined) patch.show_ratings = showRatings;

  const { error } = await supabase
    .from("voters")
    .update(patch)
    .eq("id", voterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
