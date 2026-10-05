"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { HoldToConfirm } from "../../components/ui";
import { dueMedications, scheduleLabel, sourceWho, subjectLabel } from "../../lib/data";
import { actions, usePatient } from "../../lib/store";

// Reminder — full screen, hold-to-confirm, with a plain "Not now". Holding records that the patient
// took THIS dose (their own adherence record) — it never changes what the clinician said. Only a dose
// the patient confirmed can appear here (D5).
function ReminderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { discharged } = usePatient();
  const [done, setDone] = useState(false);
  const scheduled = dueMedications.filter((m) => m.status === "scheduled");
  const med = scheduled.find((m) => m.subject === params.get("med")) ?? scheduled[0];
  const slot = Number(params.get("slot") ?? 0) || 0;
  const leave = () => router.push(discharged ? "/recovery" : "/");

  if (!med) {
    return (
      <main className="reminder">
        <p className="reminder__big">No confirmed medicines yet</p>
        <button type="button" className="btn btn--secondary" onClick={leave}>
          Go back
        </button>
      </main>
    );
  }

  if (done) {
    return (
      <main className="reminder" aria-live="polite">
        <div className="stack">
          <p className="t-label muted">Saved</p>
          <p className="reminder__big">
            You took your <span className="cap">{subjectLabel(med.subject)}</span>
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={leave}>
          Done
        </button>
      </main>
    );
  }

  return (
    <main className="reminder">
      <div className="stack stack--lg">
        <p className="t-label muted">{scheduleLabel(med.slots)}</p>
        <h1 className="reminder__big">
          Time to take your <span className="cap">{subjectLabel(med.subject)}</span>
        </h1>
        <figure className="said">
          <span className="said__quote-wrap">
            <q className="said__quote">{med.claim.verbatimText}</q>
          </span>
          <figcaption className="said__when">{sourceWho(med.claim.source)}</figcaption>
        </figure>
      </div>
      <div className="stack">
        <HoldToConfirm
          label="Hold when you've taken it"
          onComplete={() => {
            actions.addIntake(med.subject, slot);
            setDone(true);
          }}
        />
        <button type="button" className="btn btn--secondary" onClick={leave}>
          Not now
        </button>
      </div>
    </main>
  );
}

export default function Reminder() {
  return (
    <Suspense>
      <ReminderInner />
    </Suspense>
  );
}
