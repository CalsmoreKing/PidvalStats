import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = serviceClient();
  const home = new URL("/", req.url);

  const { data: row } = await supabase
    .from("login_tokens")
    .select("*")
    .eq("token", params.token)
    .maybeSingle();

  // Токен вже міг бути "з'їдений" фоновим опитуванням на іншій вкладці —
  // це нормально, значить вхід уже відбувся, просто ведемо на головну.
  if (!row || !row.voter_id) {
    return NextResponse.redirect(home);
  }

  const sessionToken = jwt.sign(
    { voter_id: row.voter_id, sub: row.voter_id, role: "authenticated" },
    process.env.SUPABASE_JWT_SECRET!,
    { expiresIn: "30d" }
  );

  await supabase.from("login_tokens").delete().eq("token", params.token);

  const res = NextResponse.redirect(home);
  res.cookies.set("barca_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
