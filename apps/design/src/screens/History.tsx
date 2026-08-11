import { useState } from "react";
import { Link } from "react-router-dom";
import { Segmented } from "../components/Segmented";
import { MoodRow } from "../components/MoodRow";
import { Alert } from "../components/Alert";
import { CheckIcon, InfoIcon, MedsIcon, HistoryIcon, ChatIcon, BellIcon } from "../icons";

export function History() {
  const [phase, setPhase] = useState<"admitted" | "recovery">("recovery");

  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <Segmented value={phase} onChange={setPhase} />
      </div>

      {phase === "recovery" ? <RecoveryContent /> : <AdmittedContent onSimulateDischarge={() => setPhase("recovery")} />}
    </div>
  );
}

function RecoveryContent() {
  return (
    <>
      <div className="section">
        <h1 className="h1">Hi, Bill</h1>
      </div>

      <div className="section">
        <h2 className="h2">How are you feeling today?</h2>
        <MoodRow />
      </div>

      <div className="section">
        <Alert title="This seems worth asking about" sub="1 thing to check">
          One source said your water tablet (diuretic) dose might be starting soon, and another
          didn't mention it. Worth asking your doctor which is current for you.
        </Alert>
      </div>

      <div className="section">
        <h2 className="h2">Today's reminders</h2>
        <div className="card">
          <div className="label">Twice a day</div>
          <div className="body" style={{ fontWeight: "var(--weight-bold)" }}>Metformin</div>
          <p className="body">
            "And your metformin for the diabetes stays the same, 500 milligrams twice a day, morning
            and evening."
          </p>
          <span className="badge badge--confirmed">
            <CheckIcon />
            Confirmed
          </span>
        </div>
        <div className="card">
          <div className="label">Once a day</div>
          <div className="body" style={{ fontWeight: "var(--weight-bold)" }}>Diuretic</div>
          <p className="body">
            "We're also thinking about starting a water tablet, a diuretic, just to help with some
            fluid we saw on your scan."
          </p>
          <span className="badge badge--needs">
            <InfoIcon />
            Needs confirming
          </span>
        </div>
      </div>

      <div className="section">
        <div className="tilerow">
          <Link className="tile" to="/medicines">
            <span className="tile__icon" aria-hidden="true"><MedsIcon size={20} /></span>
            <span className="tile__label">More on your meds</span>
          </Link>
          <a className="tile" href="#history-list">
            <span className="tile__icon" aria-hidden="true"><HistoryIcon size={20} /></span>
            <span className="tile__label">Consultation history</span>
          </a>
          <Link className="tile" to="/chat">
            <span className="tile__icon" aria-hidden="true"><ChatIcon size={20} /></span>
            <span className="tile__label">Ask again</span>
          </Link>
          <Link className="tile" to="/reminder">
            <span className="tile__icon" aria-hidden="true"><BellIcon size={20} /></span>
            <span className="tile__label">Today's reminder</span>
          </Link>
        </div>
      </div>

      <div className="section" id="history-list">
        <h2 className="h2">Consultation history</h2>
        <div className="card">
          <div className="detailrow"><span className="detailrow__label">Today</span><span className="detailrow__value">Consultant ward round</span></div>
          <div className="detailrow"><span className="detailrow__label">Duration</span><span className="detailrow__value">14 min</span></div>
        </div>
        <div className="card">
          <div className="detailrow"><span className="detailrow__label">Yesterday</span><span className="detailrow__value">Pharmacist review</span></div>
          <div className="detailrow"><span className="detailrow__label">Duration</span><span className="detailrow__value">6 min</span></div>
        </div>
      </div>
    </>
  );
}

/**
 * What the old Home screen ("What would you like to do today?") became. Its four buttons ARE the
 * tab bar now, so this doesn't re-list them — that would duplicate the nav on the same screen.
 * Instead: a warm welcome + ONE clear primary action, with a single line pointing at the rest.
 */
function AdmittedContent({ onSimulateDischarge }: { onSimulateDischarge: () => void }) {
  return (
    <>
      <div className="section">
        <h1 className="h1">Hi, Bill</h1>
        <p className="body">
          When someone comes to see you — a doctor, a nurse, anyone — you can record what they say,
          so you don't have to remember it all yourself.
        </p>
      </div>

      <div className="section">
        <Link className="btn btn-primary" style={{ width: "100%" }} to="/record">
          Record what my doctor says
        </Link>
      </div>

      <div className="section">
        <p className="label">
          You can also chat about your care, look back at what's already been said, or add a photo
          of a letter or medication chart — from the menu below.
        </p>
      </div>

      <div className="section">
        <button type="button" className="demolink" onClick={onSimulateDischarge}>
          Simulate discharge (demo)
        </button>
      </div>
    </>
  );
}
