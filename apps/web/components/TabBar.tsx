"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePatient } from "../lib/store";
import { ChatIcon, MicIcon, PaperIcon, TodayIcon } from "./icons";

/** Full-screen moments that hide the tab bar so nothing competes with them. */
const HIDDEN = ["/record", "/reminder"];

function section(path: string): "today" | "record" | "chat" | "files" {
  if (path.startsWith("/record")) return "record";
  if (path.startsWith("/chat")) return "chat";
  if (path.startsWith("/files")) return "files";
  return "today";
}

/** Four labelled destinations, always in the same place. Labels are words, never icon-only. */
export function TabBar() {
  const path = usePathname();
  const { discharged } = usePatient();
  if (HIDDEN.some((p) => path.startsWith(p))) return null;
  const active = section(path);
  const tabs = [
    { key: "today", href: discharged ? "/recovery" : "/", label: "Today", icon: <TodayIcon /> },
    { key: "record", href: "/record", label: "Record", icon: <MicIcon /> },
    { key: "chat", href: "/chat", label: "Ask", icon: <ChatIcon /> },
    { key: "files", href: "/files", label: "Papers", icon: <PaperIcon /> },
  ] as const;
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className="tab" aria-current={active === t.key ? "page" : undefined}>
          <span className="tab__icon">{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
