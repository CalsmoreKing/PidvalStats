import { getAdminInfo } from "@/lib/admin";
import { getAllMatches, getCompetitions, getRoster } from "@/lib/queries";
import CreateMatchForm from "./CreateMatchForm";
import MatchAdminRow from "./MatchAdminRow";
import AdminsManager from "./AdminsManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminInfo();

  if (!admin) {
    return (
      <div className="px-4 md:px-12 py-12 max-w-lg mx-auto text-center">
        <h1 className="font-display text-2xl text-ivory mb-3">Адмін-панель</h1>
        <p className="text-sm text-muted">
          Увійди через Telegram (кнопка зліва/зверху) — якщо твій акаунт має
          права адміна, панель зʼявиться тут автоматично.
        </p>
      </div>
    );
  }

  const [matches, competitions, roster] = await Promise.all([
    getAllMatches(),
    getCompetitions(),
    getRoster("first_team"),
  ]);

  return (
    <div className="px-4 md:px-12 py-8 max-w-3xl mx-auto">
      <div className="eyebrow mb-1">Панель адміна · {admin.role === "owner" ? "власник" : "адмін"}</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Адмінка</h1>

      <section className="mb-12">
        <h2 className="font-display text-xl text-ivory mb-4">Створити матч</h2>
        <CreateMatchForm competitions={competitions} />
      </section>

      <section className="mb-12">
        <h2 className="font-display text-xl text-ivory mb-4">Матчі</h2>
        <div className="flex flex-col gap-3">
          {matches.length === 0 && (
            <p className="text-sm text-muted">Матчів ще немає.</p>
          )}
          {matches.map((m: any) => (
            <MatchAdminRow key={m.id} match={m} roster={roster} />
          ))}
        </div>
      </section>

      {admin.role === "owner" && (
        <section className="mb-12">
          <h2 className="font-display text-xl text-ivory mb-4">Адміни</h2>
          <AdminsManager />
        </section>
      )}
    </div>
  );
}
