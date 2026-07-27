import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Перевіряє НАШ ВЛАСНИЙ підписаний cookie — не залежить від того, чи
// Supabase взагалі приймає цей токен (раніше ми ще й передавали цей
// самий JWT у Supabase для RLS, але то виявилось ненадійним — усі
// перевірки прав тепер робляться тут, у коді, через service-role
// клієнта (lib/supabase/service.ts), а не через auth.jwt() у Postgres).
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
