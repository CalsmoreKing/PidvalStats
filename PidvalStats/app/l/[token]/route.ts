export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import jwt from "jsonwebtoken";


export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServiceClient();

  const { data: row } = await supabase
    .from("login_tokens")
    .select("*")
    .eq("token", params.token)
    .maybeSingle();

  // Токен вже міг бути "з'їдений" фоновим опитуванням на іншій вкладці —
  // це нормально, значить вхід уже відбувся. Але якщо ні — кажемо про це
  // прямо в URL, замість тихо вести на головну, ніби нічого не сталось.
  if (!row || !row.voter_id) {
    return NextResponse.redirect(new URL("/?login=expired", req.url));
  }

  const sessionToken = jwt.sign(
    { voter_id: row.voter_id, sub: row.voter_id, role: "authenticated" },
    process.env.SUPABASE_JWT_SECRET!,
    { expiresIn: "30d" }
  );

  await supabase.from("login_tokens").delete().eq("token", params.token);

  const res = NextResponse.redirect(new URL("/?login=ok", req.url));
  res.cookies.set("barca_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
