import { useSearchParams } from "react-router-dom";
import { BackLink } from "../components/BackLink";
import { ChipRow } from "../components/ChipRow";

const MED_NAMES: Record<string, string> = {
  metformin: "Metformin",
  diuretic: "Diuretic",
  aspirin: "Aspirin",
  atorvastatin: "Atorvastatin",
};

const MORNING_OPTIONS = ["7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM"];
const EVENING_OPTIONS = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"];

/**
 * SCOPING NOTE: fully built out for Metformin (2 dose slots) — the richest example, since it needs
 * two independent selectors to demonstrate "every time option, individually selectable, per dose."
 * The other 3 medications (1 slot each) reuse the exact same ChipRow component with a single slot;
 * not rebuilt 3 more times for what would be identical demonstration.
 */
export function ReminderTimes() {
  const [params] = useSearchParams();
  const medId = params.get("med") ?? "metformin";
  const name = MED_NAMES[medId] ?? "Your medicine";
  const twiceDaily = medId === "metformin";

  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <BackLink to="/medicines" label="Back to your medicines" />
      </div>

      <div className="section">
        <h1 className="h1">{name} reminder times</h1>
        <p className="body">
          {twiceDaily ? "Twice a day — set a time for each dose." : "Once a day — set a time for your dose."} We'll
          only remind you once you've chosen a time; nothing is set automatically.
        </p>
      </div>

      {/* Large number over small label — the one pattern not shown in the reference image itself,
          which the brief asked for anyway. Static/illustrative here; the real app computes this live
          from whichever confirmed time is nearer. */}
      <div className="section">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="display">3h 20m</div>
          <div className="label">until your next dose</div>
        </div>
      </div>

      {/* NATIVE-PORT NOTE: ChipRow stands in for a native time picker (UIDatePicker / Android
          TimePicker) later — self-contained, nothing else depends on its internals. */}
      <div className="section">
        <h2 className="h2">{twiceDaily ? "Morning dose" : "Your dose"}</h2>
        <ChipRow label={twiceDaily ? "Morning dose time" : "Dose time"} options={MORNING_OPTIONS} defaultValue="7:30 AM" />
      </div>

      {twiceDaily ? (
        <div className="section">
          <h2 className="h2">Evening dose</h2>
          <ChipRow label="Evening dose time" options={EVENING_OPTIONS} defaultValue="6:00 PM" />
        </div>
      ) : null}
    </div>
  );
}
