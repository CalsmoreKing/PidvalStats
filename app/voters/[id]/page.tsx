import { notFound } from "next/navigation";
import { getVoterProfile, getVoterVoteHistory } from "@/lib/queries";
import { getVoterIdFromCookie } from "@/lib/supabase/authed";
import VoterProfileClient from "./VoterProfileClient";

export const dynamic = "force-dynamic";

export default async function VoterProfilePage({ params }: { params: { id: string } }) {
  const viewerVoterId = getVoterIdFromCookie();
  const isOwner = viewerVoterId === params.id;

  const voter = await getVoterProfile(params.id);
  if (!voter) return notFound();

  // Приватність: власник профілю завжди бачить свої оцінки, інші — лише
  // якщо фанат сам не вимкнув показ у налаштуваннях. Графік/улюблені теж
  // рахуються з цих самих даних — тому й вони ховаються разом.
  const canSeeRatings = isOwner || voter.showRatings !== false;
  const history = canSeeRatings ? await getVoterVoteHistory(params.id) : [];

  return <VoterProfileClient voter={voter} history={history as any[]} canSeeRatings={canSeeRatings} isOwner={isOwner} />;
}
