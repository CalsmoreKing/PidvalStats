export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function GET() {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ voter: null });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("voters")
    .select("id, display_name, telegram_username, avatar_url, custom_display_name, custom_avatar_url")
    .eq("id", voterId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ voter: null });
  }

  const admin = await getAdminInfo();

  return NextResponse.json({
    voter: {
      id: data.id,
      displayName: data.custom_display_name || data.display_name,
      username: data.telegram_username,
      avatarUrl: data.custom_avatar_url || data.avatar_url,
      isAdmin: !!admin,
      adminRole: admin?.role ?? null,
    },
  });
}
