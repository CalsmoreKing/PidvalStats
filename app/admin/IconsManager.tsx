"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StatIcon, { ICON_KEYS, IconKey } from "@/components/StatIcon";

// Вкладка «Іконки»: дизайнер (або ти) завантажує по одному файлу на подію —
// після збереження іконка одразу зʼявляється на всьому сайті: у схемі складу,
// у конструкторі складу, у голосуванні.
export default function IconsManager({ icons }: { icons: Record<string, string> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<IconKey | null>(null);
  const [msg, setMsg] = useState("");

  async function upload(key: IconKey, file: File) {
    setBusy(key);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Не вдалось завантажити файл");
      const save = await fetch("/api/admin/icons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, url: upData.url }),
      });
      const saveData = await save.json();
      if (!save.ok) throw new Error(saveData.error ?? "Не вдалось зберегти");
      setMsg("Іконку збережено — вона вже застосована на сайті.");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message ?? "Помилка");
    } finally {
      setBusy(null);
    }
  }

  async function reset(key: IconKey) {
    setBusy(key);
    setMsg("");
    const res = await fetch(`/api/admin/icons?key=${key}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setMsg("Повернули стандартну іконку.");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-gold/20 bg-panel p-4 text-sm text-ivory/90">
        <div className="font-display text-lg text-gold-bright mb-2">Інструкція для дизайнера</div>
        <ul className="list-disc pl-5 flex flex-col gap-1 text-[13px] text-muted">
          <li>
            <span className="text-ivory">Формат:</span> SVG (найкраще — не розмивається) або PNG з прозорим фоном.
            Без JPG — у нього немає прозорості.
          </li>
          <li>
            <span className="text-ivory">Розмір:</span> квадрат. PNG — від 128×128 до 256×256 пікселів. SVG — з
            viewBox квадратним (напр. 0 0 64 64).
          </li>
          <li>
            <span className="text-ivory">Вага файлу:</span> до 200 КБ (жорсткий ліміт сайту — 5 МБ).
          </li>
          <li>
            <span className="text-ivory">Читабельність:</span> іконки показуються дуже дрібно (12–14 px), тож
            без тексту й тонких ліній; простий силует і 2–3 кольори. Перевір, як вона виглядає на темному
            фіолетовому фоні (#17102A).
          </li>
          <li>
            <span className="text-ivory">Потрібно 5 файлів:</span> гол, гол з пенальті, асист, жовта і червона
            картки. Стиль має бути єдиним на всі п&apos;ять.
          </li>
        </ul>
      </section>

      {msg && <div className="text-xs text-gold-bright">{msg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ICON_KEYS.map(({ key, label, hint }) => {
          const custom = icons[key];
          return (
            <div key={key} className="rounded-xl border border-white/5 bg-panel p-4 flex flex-col gap-3">
              <div>
                <div className="text-sm text-ivory">{label}</div>
                <div className="text-[11px] text-muted">{hint}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-panel-raised flex items-center justify-center">
                  <StatIcon kind={key} className="h-10 w-10" />
                </div>
                <div className="flex items-center gap-2">
                  <StatIcon kind={key} className="h-3 w-3" />
                  <span className="text-[10px] text-muted">так — на схемі</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className={`text-xs rounded-lg border border-gold/40 text-gold-bright px-3 py-1.5 cursor-pointer ${
                    busy === key ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  {busy === key ? "…" : custom ? "Замінити файл" : "Завантажити"}
                  <input
                    type="file"
                    accept="image/svg+xml,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(key, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {custom && (
                  <button
                    onClick={() => reset(key)}
                    disabled={busy === key}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                  >
                    Стандартна
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
