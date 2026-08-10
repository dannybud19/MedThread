import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { History } from "./screens/History";
import { Medicines } from "./screens/Medicines";
import { ReminderTimes } from "./screens/ReminderTimes";
import { Record } from "./screens/Record";
import { Chat } from "./screens/Chat";
import { Files } from "./screens/Files";
import { ReminderConfirm } from "./screens/ReminderConfirm";

/**
 * The tab bar renders on every screen, including drill-downs, and never hides on scroll
 * (NAVIGATION section) — it lives here, once, outside the route switch.
 *
 * ONE DELIBERATE EXCEPTION, flagged rather than silently applied: /reminder (the hold-to-confirm
 * dose screen) hides it. That screen is opened from a system notification tap, is meant to be a
 * distraction-free "one thing to do right now" moment (D8: "full-screen, hold-to-dismiss reminder"
 * in the current app's actual design decision log), and its own "Not now" escape already covers
 * "I don't want to do this right now" — a persistent tab bar would undercut the one reason this
 * screen is full-screen at all.
 */
export function App() {
  const { pathname } = useLocation();
  const hideTabBar = pathname === "/reminder";
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/history" replace />} />
        <Route path="/history" element={<History />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/reminder-times" element={<ReminderTimes />} />
        <Route path="/record" element={<Record />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/files" element={<Files />} />
        <Route path="/reminder" element={<ReminderConfirm />} />
      </Routes>
      {hideTabBar ? null : <TabBar />}
    </>
  );
}
