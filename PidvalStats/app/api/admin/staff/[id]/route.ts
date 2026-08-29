export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { table, photoUrl, name } = await req.json();
  if (table !== "referees" && table !== "coaches") {
    return NextResponse.json({ error: "Невідома таблиця" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (photoUrl !== undefined) patch.photo_url = photoUrl || null;
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "Ім'я не може бути порожнім" }, { status: 400 });
    patch.name = name.trim();
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from(table).update(patch).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const { table } = await req.json();
  if (table !== "referees" && table !== "coaches") {
    return NextResponse.json({ error: "Невідома таблиця" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from(table).delete().eq("id", params.id);

  if (error) {
    // FK-обмеження (matches.referee_id / matches.coach_id) не дає видалити
    // персонал, прив'язаний хоча б до одного матчу — і це правильно.
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Не можна видалити — цю людину вже прив'язано хоча б до одного матчу" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

