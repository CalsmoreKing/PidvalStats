import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: NextRequest) {
  // Якщо задано TELEGRAM_WEBHOOK_SECRET — звіряємо секретний заголовок,
  // щоб цей ендпоінт не смикав хтось стороннiй видаючи себе за Telegram.
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expectedSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const update = await req.json();
  const message = update?.message;
  const text: string | undefined = message?.text;
  const from = message?.from;

  if (!text || !from || !text.startsWith("/start")) {
    return NextResponse.json({ ok: true }); // ігноруємо все, що не /start <token>
  }

  const token = text.replace("/start", "").trim();
  if (!token) {
    await sendMessage(from.id, "Відкрий цього бота за посиланням із сайту — так вхід підтвердиться автоматично.");
    return NextResponse.json({ ok: true });
  }

  const supabase = serviceClient();

  const { data: tokenRow } = await supabase
    .from("login_tokens")
    .select("token, status")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow || tokenRow.status === "claimed") {
    await sendMessage(from.id, "Це посилання вже недійсне. Поверніcь на сайт і спробуй увійти ще раз.");
    return NextResponse.json({ ok: true });
  }

  const displayName = [from.first_name, from.last_name].filter(Boolean).join(" ");

  const { data: voter, error: voterError } = await supabase
    .from("voters")
    .upsert(
      {
        telegram_id: from.id,
        telegram_username: from.username ?? null,
        display_name: displayName,
      },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();

  if (voterError || !voter) {
    await sendMessage(from.id, "Сталась помилка входу. Спробуй ще раз за хвилину.");
    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("login_tokens")
    .update({
      status: "claimed",
      telegram_id: from.id,
      telegram_username: from.username ?? null,
      display_name: displayName,
      voter_id: voter.id,
    })
    .eq("token", token);

  await sendMessage(from.id, "✅ Вхід підтверджено! Повертайся на сайт — сторінка оновиться сама.");

  return NextResponse.json({ ok: true });
}
