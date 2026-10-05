import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Literata } from "next/font/google";
import type { ReactNode } from "react";
import { TabBar } from "../components/TabBar";
import "./globals.css";

// Atkinson Hyperlegible Next (Braille Institute, built for low vision) carries the interface.
// Literata, a serif made for long reading on screens, is reserved for what clinicians actually said —
// so a quote looks different from everything the app itself writes.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-atkinson",
  display: "swap",
});
const literata = Literata({ subsets: ["latin"], weight: ["400"], variable: "--font-literata", display: "swap" });

export const metadata: Metadata = {
  title: "MedThread",
  description: "What your care team said, word for word, and who said it.",
  appleWebApp: { capable: true, title: "MedThread", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f9",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${atkinson.variable} ${literata.variable}`}>
      <body>
        <div className="app">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
