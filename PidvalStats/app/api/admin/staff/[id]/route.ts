export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { table, photoUrl } = await req.json();
  if (table !== "referees" && table !== "coaches") {
    return NextResponse.json({ error: "Невідома таблиця" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from(table)
    .update({ photo_url: photoUrl || null })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
