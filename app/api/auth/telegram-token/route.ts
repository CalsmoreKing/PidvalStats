export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";


export async function POST() {
  const token = crypto.randomBytes(16).toString("hex");
  const supabase = createServiceClient();

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
