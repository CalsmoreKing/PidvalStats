export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import jwt from "jsonwebtoken";


export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServiceClient();

  const { data: row, error } = await supabase
    .from("login_tokens")
    .select("*")
    .eq("token", params.token)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  if (row.status !== "claimed" || !row.voter_id) {
    return NextResponse.json({ status: "pending" });
  }

  const sessionToken = jwt.sign(
    { voter_id: row.voter_id, sub: row.voter_id, role: "authenticated" },
    process.env.SUPABASE_JWT_SECRET!,
    { expiresIn: "30d" }
  );

  // Одноразовий токен — прибираємо одразу після використання
  await supabase.from("login_tokens").delete().eq("token", params.token);

  const res = NextResponse.json({ status: "claimed" });
  res.cookies.set("barca_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
