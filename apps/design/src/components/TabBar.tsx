import { Link, useLocation } from "react-router-dom";
import { HistoryIcon, MicIcon, ChatIcon, FolderIcon } from "../icons";

/**
 * The persistent bottom tab bar. Four tabs matching the current app's four home actions directly
 * (per explicit product direction — not a re-grouped IA). Icon + label always visible; active tab
 * marked by fill + accent colour + label weight, never colour alone.
 *
 * NATIVE-PORT NOTE: self-contained on purpose — no dependency on page content — so swapping this for
 * a real React Navigation / Expo Router tab navigator later is a clean cut.
 */
const TABS = [
  { id: "history", label: "History", to: "/history", Icon: HistoryIcon },
  { id: "record", label: "Record", to: "/record", Icon: MicIcon },
  { id: "chat", label: "Chat", to: "/chat", Icon: ChatIcon },
  { id: "files", label: "Update files", to: "/files", Icon: FolderIcon },
] as const;

/** Which tab owns a given route — Medicines/Reminder Times nest under History, not their own tab. */
function activeTabFor(pathname: string): string {
  if (pathname.startsWith("/medicines") || pathname.startsWith("/reminder-times") || pathname.startsWith("/history")) {
    return "history";
  }
  if (pathname.startsWith("/record") || pathname.startsWith("/reminder")) return "record";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/files")) return "files";
  return "history";
}

export function TabBar() {
  const { pathname } = useLocation();
  const active = activeTabFor(pathname);
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, to, Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            to={to}
            className={"tabbar__item" + (isActive ? " tabbar__item--active" : "")}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="tabbar__icon" aria-hidden="true">
              <Icon strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className="tabbar__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
