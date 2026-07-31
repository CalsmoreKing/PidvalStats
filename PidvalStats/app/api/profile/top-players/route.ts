export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { getVoterTopPlayers } from "@/lib/queries";

export async function GET() {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ players: [] });
  }
  const players = await getVoterTopPlayers(voterId, 3);
  return NextResponse.json({ players });
}
