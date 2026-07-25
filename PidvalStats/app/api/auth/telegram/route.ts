import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Документація Telegram Login Widget:
// https://core.telegram.org/widgets/login#checking-authorization
//
// Після успішної перевірки видаємо власний JWT (підписаний SUPABASE_JWT_SECRET,
// тим самим секретом, яким Supabase підписує свої токени) з claim'ом voter_id.
// Це і є те, що читає auth.jwt() у політиках RLS в schema.sql.

function verifyTelegramAuth(params: URLSearchParams, botToken: string) {
  const data = Object.fromEntries(params.entries());
  const receivedHash = data.hash;
  delete (data as any).hash;

  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  if (computedHash !== receivedHash) return null;

  // auth_date не старший за 24 години
  const authDate = parseInt(data.auth_date, 10);
  if (Date.now() / 1000 - authDate > 86400) return null;

  return data;
}

export async function GET(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const params = req.nextUrl.searchParams;

  const verified = verifyTelegramAuth(params, botToken);
  if (!verified) {
    return NextResponse.redirect(new URL("/?auth_error=1", req.url));
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // лише на сервері, ніколи не в клієнт
  );

  const telegramId = parseInt(verified.id, 10);

  const { data: voter, error } = await supabase
    .from("voters")
    .upsert(
      {
        telegram_id: telegramId,
        telegram_username: verified.username ?? null,
        display_name: [verified.first_name, verified.last_name].filter(Boolean).join(" "),
        avatar_url: verified.photo_url ?? null,
      },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();

  if (error || !voter) {
    return NextResponse.redirect(new URL("/?auth_error=1", req.url));
  }

  const sessionToken = jwt.sign(
    {
      voter_id: voter.id,
      sub: voter.id,
      role: "authenticated",
    },
    process.env.SUPABASE_JWT_SECRET!,
    { expiresIn: "30d" }
  );

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("barca_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
