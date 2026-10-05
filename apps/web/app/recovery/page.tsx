"use client";

import Link from "next/link";
import { BellIcon, HistoryIcon, MoodFace, PillIcon, QuestionIcon } from "../../components/icons";
import { MedCard } from "../../components/MedCard";
import { PhaseSwitch } from "../../components/PhaseSwitch";
import { Row, Rows, SectionHead } from "../../components/ui";
import { dueMedications, fixturePicture, patientName, subjectLabel } from "../../lib/data";
import { actions, slotKey, usePatient, type Mood } from "../../lib/store";

// At home — the recovery dashboard after discharge. Medicines show the clinician's VERBATIM words; the
// patient picks their own reminder times (the app never chooses one); the mood check-in is the
// patient's own record and is never interpreted — no assessment, no triage, no "see a doctor" prompt.
const MOODS: ReadonlyArray<{ mood: Mood; label: string }> = [
  { mood: "very-good", label: "Very good" },
  { mood: "good", label: "Good" },
  { mood: "okay", label: "Okay" },
  { mood: "not-great", label: "Not great" },
  { mood: "poor", label: "Poor" },
];
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.mood, m.label])) as Record<Mood, string>;

const PRESET_TIMES = ["7:00 am", "8:00 am", "12:00 pm", "6:00 pm", "9:00 pm"] as const;

function clock(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "am" : "pm"}`;
}

export default function Recovery() {
  const { moods, reminderTimes } = usePatient();
  const worthAsking = fixturePicture.entries.filter((e) => e.status === "worth_confirming").length;
  const todaysMood = moods[0] && new Date(moods[0].notedAt).toDateString() === new Date().toDateString() ? moods[0] : null;
  const scheduled = dueMedications.filter((m) => m.status === "scheduled");

  return (
    <main className="page">
      <PhaseSwitch current="recovery" />

      <header className="home-head">
        <h1 className="t-display">Hello, {patientName}</h1>
        <p className="t-body muted">How are you feeling today?</p>
      </header>

      <section className="stack" aria-label="How you're feeling">
        <div className="moods" role="radiogroup" aria-label="How are you feeling today?">
          {MOODS.map(({ mood, label }) => (
            <button
              key={mood}
              type="button"
              role="radio"
              aria-checked={todaysMood?.mood === mood}
              className="mood"
              onClick={() => actions.addMood(mood)}
            >
              <MoodFace mood={mood} />
              {label}
            </button>
          ))}
        </div>
        {moods.length > 0 ? (
          <p className="t-small muted">
            Your last check-ins:{" "}
            {moods
              .slice(0, 3)
              .map((m) => `${MOOD_LABEL[m.mood]} at ${clock(m.notedAt)}`)
              .join("; ")}
          </p>
        ) : null}
      </section>

      {worthAsking > 0 ? (
        <Link href="/questions" className="ask-card">
          <QuestionIcon size={32} />
          <span className="ask-card__text">
            <span className="ask-card__title">
              {worthAsking === 1 ? "1 thing is worth asking about" : `${worthAsking} things are worth asking about`}
            </span>
            <span className="ask-card__sub">People told you different things</span>
          </span>
        </Link>
      ) : null}

      <section className="stack stack--lg">
        <SectionHead title="Your medicines" sub="In your care team's words" />
        {dueMedications.map((med) => (
          <MedCard key={med.id} med={med} />
        ))}
      </section>

      {scheduled.length > 0 ? (
        <section className="stack stack--lg" id="times">
          <SectionHead title="Your reminder times" sub="You choose when. Nothing is set until you pick a time." />
          {scheduled.flatMap((med) =>
            med.slots.map((slot, i) => {
              const key = slotKey(med.subject, i);
              const subject = subjectLabel(med.subject);
              const when = med.slots.length > 1 ? (slot.label ?? `dose ${i + 1}`) : null;
              const name = when ? `${subject}, ${when}` : subject;
              return (
                <div key={key} className="stack" role="group" aria-label={`Reminder time for ${name}`}>
                  <span className="t-label">
                    <span className="cap">{subject}</span>
                    {when ? `, ${when}` : null}
                  </span>
                  <div className="chips">
                    {PRESET_TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="chip"
                        aria-pressed={reminderTimes[key] === t}
                        onClick={() => actions.setReminderTime(med.subject, i, t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }),
          )}
        </section>
      ) : null}

      <section className="stack">
        <SectionHead title="Your care" />
        <Rows>
          <Row href="/reminder" label="Today's reminder" detail="Confirm a dose you've taken" icon={<BellIcon />} />
          <Row href="/meds" label="More on your medicines" icon={<PillIcon />} />
          <Row href="/history" label="Conversations" detail="From your hospital stay" icon={<HistoryIcon />} />
        </Rows>
      </section>
    </main>
  );
}
