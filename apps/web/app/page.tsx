"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HistoryIcon, MicIcon, PillIcon, QuestionIcon } from "../components/icons";
import { PhaseSwitch } from "../components/PhaseSwitch";
import { Row, Rows, Said, SectionHead } from "../components/ui";
import { entryId, longToday, patientName } from "../lib/data";
import { actions, usePatient, usePicture } from "../lib/store";

// Today — the hospital-stay home. Recording is the one big action (it's what happens at the bedside);
// then anything worth asking about; then the latest things the care team said, verbatim.
export default function Today() {
  const router = useRouter();
  const { discharged } = usePatient();
  const { picture, live } = usePicture();
  const [today, setToday] = useState("");
  useEffect(() => setToday(longToday(new Date())), []);

  const asks = picture.questions.length;
  const latest = picture.newest.filter((c) => c.source.kind === "audio").slice(0, 2);

  return (
    <main className="page">
      {discharged ? <PhaseSwitch current="stay" /> : null}

      <header className="home-head">
        <p className="home-date" suppressHydrationWarning>
          {today || " "}
        </p>
        <h1 className="t-display">Hello, {patientName}</h1>
      </header>

      <Link href="/record" className="record-hero">
        <span className="record-hero__dot">
          <MicIcon size={32} />
        </span>
        <span>
          <span className="record-hero__title">Record a conversation</span>
          <span className="record-hero__sub">When someone comes to your bed</span>
        </span>
      </Link>

      {asks > 0 ? (
        <Link href="/questions" className="ask-card">
          <QuestionIcon size={32} />
          <span className="ask-card__text">
            <span className="ask-card__title">
              {asks === 1 ? "1 thing is worth asking about" : `${asks} things are worth asking about`}
            </span>
            <span className="ask-card__sub">People told you different things</span>
          </span>
        </Link>
      ) : null}

      {latest.length > 0 ? (
        <section className="stack">
          <SectionHead
            title="Latest from your care team"
            sub={live ? "From your last recording" : "From your stay so far"}
          />
          {latest.map((c) => (
            <Said key={c.id} claim={c} clamp href={`/topic/${entryId(c.category, c.subject)}`} />
          ))}
        </section>
      ) : null}

      <section className="stack">
        <SectionHead title="Your stay" />
        <Rows>
          <Row href="/history" label="Conversations" detail="Everyone who came to your bed" icon={<HistoryIcon />} />
          <Row href="/meds" label="Your medicines" detail="What you were told to take" icon={<PillIcon />} />
          <Row href="/questions" label="Questions to ask" detail="Things to check with your team" icon={<QuestionIcon />} />
        </Rows>
      </section>

      {/* Demo controls: flip the discharge phase with no backend, or go back to the sample stay. */}
      <section className="stack">
        {discharged || live ? (
          <button type="button" className="btn btn--quiet" onClick={() => actions.resetDemo()}>
            Reset demo
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              actions.setDischarged(true);
              router.push("/recovery");
            }}
          >
            Simulate going home (demo)
          </button>
        )}
      </section>
    </main>
  );
}
