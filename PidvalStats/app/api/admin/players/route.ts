export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";
import { POSITIONS } from "@/lib/positions";

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const {
    teamId,
    fullName,
    position,
    jerseyNumber,
    nationality,
    birthDate,
    shortName,
  } = await req.json();

  if (!teamId || !fullName || !position || !nationality || !birthDate) {
    return NextResponse.json(
      { error: "Заповни команду, ім'я, позицію, національність і дату народження" },
      { status: 400 }
    );
  }
  if (!POSITIONS.includes(position)) {
    return NextResponse.json({ error: "Невідома позиція" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .insert({
      team_id: teamId,
      full_name: fullName,
      position,
      jersey_number: jerseyNumber ?? null,
      nationality,
      birth_date: birthDate,
      short_name: shortName || null,
    })
    .select(
      "id, full_name, short_name, jersey_number, position, positions, nationality, birth_date, photo_url, photo_focus_x, photo_focus_y, photo_zoom, is_active, team_id, teams(slug, name)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, player: data });
}
