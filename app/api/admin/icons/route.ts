export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

const KEYS = ["goal", "penalty_goal", "assist", "yellow_card", "red_card"];

// Зберегти (або замінити) іконку: файл уже завантажено через
// /api/admin/upload, тут лише записуємо його URL під ключем.
export async function PUT(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }
  const { key, url } = await req.json();
  if (!KEYS.includes(key) || typeof url !== "string" || !/^https:\/\//.test(url)) {
    return NextResponse.json({ error: "Некоректна іконка" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("custom_icons")
    .upsert({ key, url, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Повернути вбудовану іконку за замовчуванням
export async function DELETE(req: NextRequest) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key || !KEYS.includes(key)) {
    return NextResponse.json({ error: "Некоректний ключ" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from("custom_icons").delete().eq("key", key);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
