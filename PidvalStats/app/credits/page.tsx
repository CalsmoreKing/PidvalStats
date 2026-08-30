import { getAdmins, getCreditHelpers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const [admins, helpers]: [any[], any[]] = await Promise.all([getAdmins(), getCreditHelpers()]);

  return (
    <div className="px-4 md:px-12 py-16 max-w-2xl mx-auto">
      <div className="eyebrow mb-2">Контакт</div>
      <h1 className="font-display text-3xl text-ivory mb-8">Хто робить цей сайт</h1>

      {admins.length === 0 && helpers.length === 0 ? (
        <p className="text-sm text-muted">Список поки порожній.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((a) => {
            const v = a.voter;
            const name = v?.custom_display_name || v?.display_name || v?.telegram_username || "Адмін";
            const avatarUrl = v?.custom_avatar_url || v?.avatar_url;
            const role = a.title || (a.role === "owner" ? "Власник" : "Адмін");
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-panel px-4 py-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-panel-raised shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-ivory/30 font-display">
                      {name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-ivory">
                    {name}
                    {v?.telegram_username && (
                      <span className="text-muted font-normal"> · @{v.telegram_username}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{role}</div>
                </div>
              </div>
            );
          })}
          {helpers.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-panel px-4 py-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-panel-raised shrink-0">
                {h.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-ivory/30 font-display">
                    {h.name[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-ivory">{h.name}</div>
                <div className="text-xs text-muted">{h.title || "Допомагав з проєктом"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
