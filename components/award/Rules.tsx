import { AwardSettings, STAT_CATEGORIES, PLACE_POINTS } from "@/lib/award";

const pctOf = (w: number, sum: number) => Math.round((Number(w) / sum) * 100);
const dec = (n: number) => (n / 100).toString().replace(".", ",");

export default function AwardRules({ settings }: { settings: AwardSettings }) {
  const sum = Number(settings.weight_base) + Number(settings.weight_votes) + Number(settings.weight_activity) || 1;
  const pb = pctOf(settings.weight_base, sum);
  const pv = pctOf(settings.weight_votes, sum);
  const pa = pctOf(settings.weight_activity, sum);

  const weights = [
    {
      pct: pb,
      title: "Статистика чату",
      text: "Бал від 0 до 100 за рік повідомлень: активність, вплив, діалог, контент і якість.",
    },
    {
      pct: pv,
      title: "Голосування учасників",
      text: `Кожен обирає п'ятьох: 1 місце — ${PLACE_POINTS[0]} балів, 5 місце — ${PLACE_POINTS[4]} бал. Лідер голосування отримує 100, решта пропорційно.`,
    },
    {
      pct: pa,
      title: "Активність на сайті",
      text: "Частка матчів Барселони, які ти оцінив на цьому сайті. Усі матчі — 100.",
    },
  ];

  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl text-champagne mb-5 text-center">Правила</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {weights.map((w) => (
          <div key={w.title} className="gold-frame rounded-2xl px-5 py-5 flex md:flex-col gap-4 md:gap-2 items-center md:items-start">
            <div className="gold-text font-display font-black text-5xl md:text-6xl leading-none shrink-0 min-w-[5.5rem] pr-1 md:min-w-0">
              {w.pct}%
            </div>
            <div>
              <div className="font-display text-lg text-ivory leading-tight">{w.title}</div>
              <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">{w.text}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center font-utility text-xs md:text-sm text-gold-soft">
        Разом = {dec(pb)} × статистика + {dec(pv)} × голосування + {dec(pa)} × сайт
      </p>

      <div className="gold-frame rounded-2xl mt-6 px-5 py-5">
        <h3 className="font-display text-xl text-ivory mb-3">Як голосувати</h3>
        <ul className="text-sm text-ivory/85 flex flex-col gap-2 leading-relaxed">
          <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Голосують лише ті, хто увійшов через Telegram: один акаунт — один бюлетень. Накрутити його не вийде.</span></li>
          <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Обери п&apos;ятьох у порядку місць: перший клік — 1 місце, п&apos;ятий — 5 місце.</span></li>
          <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>За себе голосувати не можна, за одну людину двічі — теж.</span></li>
          <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Поки голосування відкрите, свій вибір можна змінити. Чужі голоси ніхто не бачить.</span></li>
          {settings.min_matches_voted > 0 && (
            <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Щоб голосувати, оціни на сайті щонайменше {settings.min_matches_voted} матч(ів) Барселони.</span></li>
          )}
          {settings.registered_before && (
            <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Акаунти, створені після {new Date(settings.registered_before).toLocaleDateString("uk-UA")}, не голосують.</span></li>
          )}
          <li className="flex gap-3"><span className="text-gold-bright">✦</span><span>Підсумки голосування відкриють після його закриття — щоб ніхто не підлаштовувався під лідера.</span></li>
        </ul>
      </div>

      <details className="gold-frame rounded-2xl mt-3 group">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
          <span className="font-display text-xl text-ivory">Як рахується статистичний бал</span>
          <span className="text-gold-bright text-sm transition-transform duration-200 group-open:rotate-180">▾</span>
        </summary>
        <div className="px-5 pb-5 text-sm text-ivory/85 leading-relaxed flex flex-col gap-4">
          <p>
            Рахували за період 26.10.2025 — 26.10.2026 (366 днів). У вибірці 113 акаунтів людей — без каналів і ботів,
            щонайменше 300 повідомлень і 20 активних днів. У номінанти пройшли 30 найкращих.
          </p>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-muted text-xs">
                  <th className="px-2 py-2 font-normal">Категорія</th>
                  <th className="px-2 py-2 font-normal text-right">Макс.</th>
                  <th className="px-2 py-2 font-normal">З чого складається</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {STAT_CATEGORIES.map((c) => (
                  <tr key={c.key}>
                    <td className="px-2 py-2 text-ivory font-medium">{c.label}</td>
                    <td className="px-2 py-2 text-right font-utility text-gold-bright">{c.max}</td>
                    <td className="px-2 py-2 text-muted">
                      {c.parts.map(([, label, max]) => `${label} — ${max}`).join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Для великих кількостей працює логарифмічна шкала:{" "}
            <span className="font-utility text-xs text-champagne">бал = максимум × ln(1 + показник) / ln(1 + межа)</span>, але не більше
            максимуму. Межа — 99-й перцентиль серед усіх оцінених: повідомлення — 59 720, символи — 1 732 818, отримані відповіді —
            28 748, реакції — 9 029, надані відповіді — 27 159, контент — 4 949, довгі повідомлення — 953. Завдяки цьому різниця
            між 5 тис. і 50 тис. повідомлень важить більше, ніж між 50 тис. і 147 тис., і самий лише обсяг не вирішує все.
          </p>
          <p>
            Активні дні рахуються як частка від 366, кількість різних людей, які відповідали, — за коренем. У якості повний бал
            дає довжина повідомлень 25–90 символів і частка реакцій серед усіх учасників.
          </p>
          <p className="text-muted">
            Чого бал не вимірює: зміст і користь повідомлень, гумор, допомогу, токсичність і модерацію. Це лише кількісний
            відбір номінантів — а далі вирішують люди.
          </p>

          <div className="gold-rule" />
          <p>
            <span className="text-ivory font-medium">Активність на сайті.</span> Матч зараховується, якщо ти оцінив щонайменше{" "}
            {settings.min_complete_ratings} гравців у ньому — один матч дає не більше одного зарахованого комплекту. Бал сайту = 100 ×
            оцінені матчі / усі підсумовані матчі.
          </p>
        </div>
      </details>
    </section>
  );
}
