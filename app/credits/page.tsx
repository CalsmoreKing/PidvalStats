import Link from "next/link";
import { getAdmins, getCreditHelpers } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Person = {
  key: string;
  name: string;
  username?: string | null;
  role: string;
  avatarUrl?: string | null;
  href?: string; // профіль фаната — лише у тих, хто має акаунт
};

export default async function CreditsPage() {
  const [admins, helpers]: [any[], any[]] = await Promise.all([getAdmins(), getCreditHelpers()]);

  const people: Person[] = [
    ...admins.map((a): Person => {
      const v = a.voter;
      return {
        key: `a-${a.id}`,
        name: v?.custom_display_name || v?.display_name || v?.telegram_username || "Адмін",
        username: v?.telegram_username,
        role: a.title || (a.role === "owner" ? "Власник" : "Адмін"),
        avatarUrl: v?.custom_avatar_url || v?.avatar_url,
        href: a.voter_id ? `/voters/${a.voter_id}` : undefined,
      };
    }),
    ...helpers.map(
      (h): Person => ({
        key: `h-${h.id}`,
        name: h.name,
        role: h.title || "Допомагав з проєктом",
        avatarUrl: h.photo_url,
      })
    ),
  ];

  return (
    <div className="px-4 md:px-12 py-16 max-w-5xl mx-auto">
      <div className="eyebrow mb-2">Контакт</div>
      <h1 className="font-display text-3xl text-ivory mb-10">Хто робить цей сайт</h1>

      {people.length === 0 ? (
        <p className="text-sm text-muted">Список поки порожній.</p>
      ) : (
        // По 4 в ряд (по 2 на телефоні). flex-wrap + justify-center: неповний
        // останній ряд сам центрується, а не липне до лівого краю.
        <div className="flex flex-wrap justify-center gap-4">
          {people.map((p) => (
            <PersonCard key={p.key} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person: p }: { person: Person }) {
  const body = (
    <>
      <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden bg-panel-raised ring-2 ring-white/5 group-hover:ring-gold/50 transition-all duration-200 shrink-0">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ivory/30 font-display text-3xl">
            {p.name[0]}
          </div>
        )}
      </div>
      <div className="mt-4 min-w-0 w-full">
        <div className="font-display text-lg text-ivory leading-tight truncate">{p.name}</div>
        {p.username && <div className="text-xs text-muted truncate">@{p.username}</div>}
        <div className="text-xs text-gold-soft mt-2 leading-snug line-clamp-3">{p.role}</div>
      </div>
    </>
  );

  const cls =
    "group flex flex-col items-center text-center rounded-2xl border border-white/5 bg-panel px-4 py-6 w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] transition-all duration-200";

  return p.href ? (
    <Link href={p.href} className={`${cls} hover:border-gold/40 hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
