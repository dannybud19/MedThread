import { Navigate, Route, Routes } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { History } from "./screens/History";
import { Medicines } from "./screens/Medicines";
import { ReminderTimes } from "./screens/ReminderTimes";
import { Record } from "./screens/Record";
import { Placeholder } from "./screens/Placeholder";

/** The tab bar renders on every screen, including drill-downs, and never hides on scroll
 * (NAVIGATION section) — it lives here, once, outside the route switch. */
export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/history" replace />} />
        <Route path="/history" element={<History />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/reminder-times" element={<ReminderTimes />} />
        <Route path="/record" element={<Record />} />
        <Route path="/chat" element={<Placeholder title="Chat" />} />
        <Route path="/files" element={<Placeholder title="Update medical files" />} />
        <Route path="/reminder" element={<Placeholder title="Today's reminder" />} />
      </Routes>
      <TabBar />
    </>
  );
}
