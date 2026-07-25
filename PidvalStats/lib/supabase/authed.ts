import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export function getVoterIdFromCookie(): string | null {
  const token = cookies().get("barca_session")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as {
      voter_id: string;
    };
    return payload.voter_id;
  } catch {
    return null;
  }
}

// Клієнт, підписаний тим самим JWT, що і сесія користувача —
// PostgREST/RLS бачить auth.jwt() ->> 'voter_id' і застосовує політики.
export function createAuthedSupabase() {
  const token = cookies().get("barca_session")?.value;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}
