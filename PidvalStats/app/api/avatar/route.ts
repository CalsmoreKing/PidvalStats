export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const voterId = getVoterIdFromCookie();
  if (!voterId) {
    return NextResponse.json({ error: "Увійдіть через Telegram" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Файл не отримано" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Це не зображення" }, { status: 400 });
  }
  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл занадто великий (максимум 3 МБ)" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${voterId}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  // Кешбастер, щоб оновлена аватарка одразу підхопилась (шлях однаковий для того ж voterId)
  const url = `${pub.publicUrl}?t=${Date.now()}`;
  return NextResponse.json({ url });
}
