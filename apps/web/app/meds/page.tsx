"use client";

import Link from "next/link";
import { TopBar } from "../../components/ui";
import { dueMedications } from "../../lib/data";
import { slotKey, usePatient } from "../../lib/store";
import { MedCard } from "../../components/MedCard";

// Your medicines — every medicine you've been told about, in the clinician's own words, with how often
// (parsed from what you confirmed) and the reminder times YOU set. Tap one for the full trail.
export default function Meds() {
  const { reminderTimes } = usePatient();
  return (
    <>
      <TopBar />
      <main className="page">
        <header className="stack">
          <h1 className="t-display">Your medicines</h1>
          <p className="t-body muted">Everything you&apos;ve been told to take, in your care team&apos;s words.</p>
        </header>
        <div className="stack stack--lg">
          {dueMedications.map((med) => {
            const times =
              med.status === "scheduled"
                ? med.slots.map((_, i) => reminderTimes[slotKey(med.subject, i)]).filter((t): t is string => Boolean(t))
                : [];
            return (
              <MedCard key={med.id} med={med}>
                {med.status === "scheduled" ? (
                  <p className="t-small">
                    {times.length > 0 ? `Your reminders: ${times.join(" and ")}` : (
                      <>
                        No reminder times yet. <Link className="link" href="/recovery#times">Set them</Link>
                      </>
                    )}
                  </p>
                ) : null}
              </MedCard>
            );
          })}
        </div>
      </main>
    </>
  );
}
