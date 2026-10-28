import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminInfo = { voterId: string; role: "owner" | "admin" } | null;

export async function getAdminInfo(): Promise<AdminInfo> {
  const voterId = getVoterIdFromCookie();
  if (!voterId) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("role")
    .eq("voter_id", voterId)
    .maybeSingle();

  if (error || !data) return null;
  return { voterId, role: data.role as "owner" | "admin" };
}
