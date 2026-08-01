"use client";

// Рендериться на клієнті, тому браузер сам підставляє часовий пояс глядача —
// адмін завжди вписує час в один спосіб (свій), а кожен фанат бачить кікофф
// у СВОЄМУ поясі (Україна/Польща/Німеччина/Іспанія — будь-де) автоматично.
export default function LocalDateTime({
  iso,
  mode = "datetime",
}: {
  iso: string;
  mode?: "date" | "time" | "datetime";
}) {
  const d = new Date(iso);
  if (mode === "date") {
    return <>{d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}</>;
  }
  if (mode === "time") {
    return <>{d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}</>;
  }
  return (
    <>
      {d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}{" "}
      {d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
    </>
  );
}
