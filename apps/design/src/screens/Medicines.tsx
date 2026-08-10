import { Link } from "react-router-dom";
import { BackLink } from "../components/BackLink";
import { CheckIcon, InfoIcon, ChevronForwardIcon } from "../icons";

type Medication = {
  id: string;
  frequency: string;
  name: string;
  gloss?: string;
  quote: string;
  discrepancy?: string;
  status: "confirmed" | "needs";
};

const MEDICATIONS: Medication[] = [
  {
    id: "metformin",
    frequency: "Twice a day",
    name: "Metformin",
    quote: "And your metformin for the diabetes stays the same, 500 milligrams twice a day, morning and evening.",
    status: "confirmed",
  },
  {
    id: "diuretic",
    frequency: "Once a day",
    name: "Diuretic",
    gloss: "a water tablet",
    quote: "We're also thinking about starting a water tablet, a diuretic, just to help with some fluid we saw on your scan.",
    status: "needs",
  },
  {
    id: "aspirin",
    frequency: "Once a day",
    name: "Aspirin",
    quote: "Continue the aspirin, seventy-five milligrams, once a day, for your heart.",
    discrepancy: "your discharge letter says 150 milligrams",
    status: "needs",
  },
  {
    id: "atorvastatin",
    frequency: "Once a day, at night",
    name: "Atorvastatin",
    gloss: "a cholesterol medicine",
    quote: "You'll stay on the atorvastatin, twenty milligrams, once at night, for your cholesterol.",
    status: "confirmed",
  },
];

export function Medicines() {
  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <BackLink to="/history" label="Back to History" />
      </div>

      <div className="section">
        <h1 className="h1">Your medicines</h1>
        <p className="body">What was said about each one, and where it stands.</p>
      </div>

      <div className="section">
        {MEDICATIONS.map((med) => (
          <Link key={med.id} className="card medcard" to={`/reminder-times?med=${med.id}`}>
            <div className="medcard__top">
              <div>
                <div className="label">{med.frequency}</div>
                <div className="body medcard__name">
                  {med.name}
                  {med.gloss ? <span className="medcard__gloss"> — {med.gloss}</span> : null}
                </div>
              </div>
              <span className="medcard__chevron"><ChevronForwardIcon /></span>
            </div>
            <p className="body medcard__quote">
              "{med.quote}"
              {med.discrepancy ? <span className="label"> — {med.discrepancy}</span> : null}
            </p>
            <span className={"badge " + (med.status === "confirmed" ? "badge--confirmed" : "badge--needs")}>
              {med.status === "confirmed" ? <CheckIcon /> : <InfoIcon />}
              {med.status === "confirmed" ? "Confirmed" : "Needs confirming"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
