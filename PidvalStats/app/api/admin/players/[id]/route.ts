export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { photoUrl, shortName, positions, photoFocusX, photoFocusY, fullName, jerseyNumber } = await req.json();
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = {};
  if (photoUrl !== undefined) patch.photo_url = photoUrl;
  if (shortName !== undefined) patch.short_name = shortName;
  if (positions !== undefined) patch.positions = positions;
  if (photoFocusX !== undefined) patch.photo_focus_x = photoFocusX;
  if (photoFocusY !== undefined) patch.photo_focus_y = photoFocusY;
  if (fullName !== undefined) patch.full_name = fullName;
  if (jerseyNumber !== undefined) patch.jersey_number = jerseyNumber;

  const { error } = await supabase.from("players").update(patch).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
