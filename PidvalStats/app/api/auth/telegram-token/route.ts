export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  const token = crypto.randomBytes(16).toString("hex");
  const supabase = serviceClient();

  // прибираємо застарілі непідтверджені токени (старші за годину) заодно
  await supabase
    .from("login_tokens")
    .delete()
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - 60 * 60_000).toISOString());

  const { error } = await supabase.from("login_tokens").insert({ token, status: "pending" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}
