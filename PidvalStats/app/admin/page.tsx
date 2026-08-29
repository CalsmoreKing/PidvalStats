import { getAdminInfo } from "@/lib/admin";
import {
  getAllMatches,
  getCompetitions,
  getRoster,
  getFullRoster,
  getAllTeams,
  getLastMatch,
  getVoters,
  getLineupForMatch,
  getFirstTeam,
  getReferees,
  getCoaches,
  getAdmins,
} from "@/lib/queries";
import CreateMatchForm from "./CreateMatchForm";
import MatchAdminRow from "./MatchAdminRow";
import AdminsManager from "./AdminsManager";
import RosterManager from "./RosterManager";
import VotersManager from "./VotersManager";
import ClubSettings from "./ClubSettings";
import StaffManager from "./StaffManager";
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

  const [matches, competitions, roster, fullRoster, teams, lastMatch, voters, team, referees, coaches, admins] =
    await Promise.all([
      getAllMatches(),
      getCompetitions(),
      getRoster("first_team"),
      getFullRoster(),
      getAllTeams(),
      getLastMatch(),
      getVoters(),
      getFirstTeam(),
      getReferees(),
      getCoaches(),
      getAdmins(),
    ]);

  const lineups = await Promise.all(matches.map((m: any) => getLineupForMatch(m.id)));

  const matchesContent = (
    <>
      <section className="mb-10">
        <h2 className="font-display text-xl text-ivory mb-4">Створити матч</h2>
        <CreateMatchForm competitions={competitions} lastMatch={lastMatch} referees={referees} coaches={coaches} />
      </section>
      <section>
        <h2 className="font-display text-xl text-ivory mb-4">Матчі</h2>
        <div className="flex flex-col gap-3">
          {matches.length === 0 && <p className="text-sm text-muted">Матчів ще немає.</p>}
          {matches.map((m: any, i: number) => (
            <MatchAdminRow key={m.id} match={m} roster={roster} existingLineup={lineups[i]} competitions={competitions} referees={referees} coaches={coaches} />
          ))}
        </div>
      </section>
    </>
  );

  const tabs = [
    { key: "matches", label: "Матчі", content: matchesContent },
    { key: "roster", label: "Гравці", content: <RosterManager roster={fullRoster} teams={teams} /> },
    { key: "voters", label: "Фанати", content: <VotersManager voters={voters} /> },
    { key: "club", label: "Клуб", content: team && <ClubSettings team={team} /> },
    { key: "staff", label: "Персонал", content: <StaffManager referees={referees} coaches={coaches} /> },
    { key: "admins", label: "Адміни", content: <AdminsManager admins={admins} isOwnerViewer={admin.role === "owner"} /> },
  ];

  return (
    <div className="px-4 md:px-12 py-8 max-w-5xl mx-auto">
      <div className="eyebrow mb-1">Панель адміна · {admin.role === "owner" ? "власник" : "адмін"}</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Адмінка</h1>
      <AdminTabs tabs={tabs} />
    </div>
  );
}
