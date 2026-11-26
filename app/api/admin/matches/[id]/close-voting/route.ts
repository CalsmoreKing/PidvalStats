export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { DATA_TAGS } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminInfo } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminInfo();
  if (!admin) {
    return NextResponse.json({ error: "Лише для адмінів" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("finalize_match", { p_match_id: params.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Кешовані сторінки (Сезон, Головна) мають показати нові оцінки одразу —
  // не через хвилину, коли сам закінчиться revalidate.
  revalidatePath("/season");
  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath(`/matches/${params.id}`);
  revalidatePath("/voters");
  for (const tag of Object.values(DATA_TAGS)) revalidateTag(tag);
  return NextResponse.json({ ok: true });
}
