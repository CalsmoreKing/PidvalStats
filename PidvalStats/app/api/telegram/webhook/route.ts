import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("webhook: TELEGRAM_BOT_TOKEN не задано");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("webhook: sendMessage не вдався", res.status, await res.text());
  }
}

export async function POST(req: NextRequest) {
  const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const got = req.headers.get("x-telegram-bot-api-secret-token");
      if (got !== expectedSecret) {
        console.error("webhook: невірний secret_token у заголовку");
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const update = await req.json();
    console.log("webhook update:", JSON.stringify(update));

    const message = update?.message;
    const text: string | undefined = message?.text;
    const from = message?.from;

    if (!text || !from || !text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const token = text.replace("/start", "").trim();
    if (!token) {
      await sendMessage(from.id, "Відкрий цього бота за посиланням із сайту — так вхід підтвердиться автоматично.");
      return NextResponse.json({ ok: true });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("webhook: відсутні змінні середовища Supabase");
      await sendMessage(from.id, "⚠️ Технічна помилка на сервері (env). Скажи адміну.");
      return NextResponse.json({ ok: true });
    }

    const supabase = serviceClient();

    const { data: tokenRow, error: tokenReadError } = await supabase
      .from("login_tokens")
      .select("token, status")
      .eq("token", token)
      .maybeSingle();

    if (tokenReadError) {
      console.error("webhook: помилка читання login_tokens", tokenReadError);
      await sendMessage(from.id, "⚠️ Технічна помилка на сервері (база). Скажи адміну.");
      return NextResponse.json({ ok: true });
    }

    if (!tokenRow || tokenRow.status === "claimed") {
      await sendMessage(from.id, "Це посилання вже недійсне. Повернись на сайт і спробуй увійти ще раз.");
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
      console.error("webhook: помилка upsert voters", voterError);
      await sendMessage(from.id, "⚠️ Технічна помилка входу. Скажи адміну.");
      return NextResponse.json({ ok: true });
    }

    const { error: claimError } = await supabase
      .from("login_tokens")
      .update({
        status: "claimed",
        telegram_id: from.id,
        telegram_username: from.username ?? null,
        display_name: displayName,
        voter_id: voter.id,
      })
      .eq("token", token);

    if (claimError) {
      console.error("webhook: помилка оновлення login_tokens", claimError);
      await sendMessage(from.id, "⚠️ Технічна помилка підтвердження. Скажи адміну.");
      return NextResponse.json({ ok: true });
    }

    await sendMessage(
      from.id,
      `✅ Вхід підтверджено! Тисни, щоб повернутись на сайт:\n${siteUrl}/l/${token}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook: непіймана помилка", err);
    return NextResponse.json({ ok: true }); // 200, щоб Telegram не спамив ретраями
  }
}
