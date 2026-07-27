export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ voter: null });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("voters")
    .select("display_name, telegram_username, avatar_url")
    .eq("id", voterId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ voter: null });
  }

  return NextResponse.json({
    voter: {
      displayName: data.display_name,
      username: data.telegram_username,
      avatarUrl: data.avatar_url,
    },
  });
}
