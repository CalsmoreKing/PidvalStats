export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { getVoterStats } from "@/lib/queries";

export async function GET() {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ top: [], bottom: [], histogram: [] });
  }
  const stats = await getVoterStats(voterId);
  return NextResponse.json(stats);
}
