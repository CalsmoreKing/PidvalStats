import { getAdminInfo } from "@/lib/admin";
import {
  getAllMatches,
  getCompetitions,
  getRoster,
  getLastMatch,
  getVoters,
  getLineupForMatch,
  getFirstTeam,
} from "@/lib/queries";
import CreateMatchForm from "./CreateMatchForm";
import MatchAdminRow from "./MatchAdminRow";
import AdminsManager from "./AdminsManager";
import RosterManager from "./RosterManager";
import VotersManager from "./VotersManager";
import ClubSettings from "./ClubSettings";
import AdminTabs from "./AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminInfo();

  if (!admin) {
    return (
      <div className="px-4 md:px-12 py-12 max-w-lg mx-auto text-center">
        <h1 className="font-display text-2xl text-ivory mb-3">Адмін-панель</h1>
        <p className="text-sm text-muted">
          Увійди через Telegram (кнопка зверху) — якщо твій акаунт має
          права адміна, панель зʼявиться тут автоматично.
        </p>
      </div>
    );
  }

  const [matches, competitions, roster, lastMatch, voters, team] = await Promise.all([
    getAllMatches(),
    getCompetitions(),
    getRoster("first_team"),
    getLastMatch(),
    getVoters(),
    getFirstTeam(),
  ]);

  const lineups = await Promise.all(matches.map((m: any) => getLineupForMatch(m.id)));

  const matchesContent = (
    <>
      <section className="mb-10">
        <h2 className="font-display text-xl text-ivory mb-4">Створити матч</h2>
        <CreateMatchForm competitions={competitions} lastMatch={lastMatch} />
      </section>
      <section>
        <h2 className="font-display text-xl text-ivory mb-4">Матчі</h2>
        <div className="flex flex-col gap-3">
          {matches.length === 0 && <p className="text-sm text-muted">Матчів ще немає.</p>}
          {matches.map((m: any, i: number) => (
            <MatchAdminRow key={m.id} match={m} roster={roster} existingLineup={lineups[i]} competitions={competitions} />
          ))}
        </div>
      </section>
    </>
  );

  const tabs = [
    { key: "matches", label: "Матчі", content: matchesContent },
    { key: "roster", label: "Гравці", content: <RosterManager roster={roster} /> },
    { key: "voters", label: "Фанати", content: <VotersManager voters={voters} /> },
    { key: "club", label: "Клуб", content: team && <ClubSettings team={team} /> },
  ];
  if (admin.role === "owner") {
    tabs.push({ key: "admins", label: "Адміни", content: <AdminsManager /> });
  }

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      <div className="eyebrow mb-1">Панель адміна · {admin.role === "owner" ? "власник" : "адмін"}</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Адмінка</h1>
      <AdminTabs tabs={tabs} />
    </div>
  );
}
