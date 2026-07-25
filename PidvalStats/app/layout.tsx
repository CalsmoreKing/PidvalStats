import type { Metadata } from "next";
import { Fraunces, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const display = Fraunces({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "900"],
  variable: "--font-display",
});
const body = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});
const utility = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-utility",
});

export const metadata: Metadata = {
  title: "Барселона · Оцінки фанатів",
  description: "Оцінюй гравців Барселони після кожного матчу",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={`${display.variable} ${body.variable} ${utility.variable}`}>
        <div className="trophy-watermark" aria-hidden />
        <div className="bg-vignette" aria-hidden />
        <div className="relative z-10 flex min-h-dvh">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
