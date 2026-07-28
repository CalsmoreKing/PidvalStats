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
    .select("display_name, telegram_username, avatar_url")
    .eq("id", voterId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ voter: null });
  }

  const admin = await getAdminInfo();

  return NextResponse.json({
    voter: {
      displayName: data.display_name,
      username: data.telegram_username,
      avatarUrl: data.avatar_url,
      isAdmin: !!admin,
      adminRole: admin?.role ?? null,
    },
  });
}
