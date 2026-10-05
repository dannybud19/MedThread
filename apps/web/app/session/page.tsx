"use client";

import Link from "next/link";
import { Said, SectionHead, StatusPill, TopBar } from "../../components/ui";
import { sessionTranscript, subjectLabel, transcriptView } from "../../lib/data";
import { usePatient, usePicture } from "../../lib/store";

// Your recording — what was said (the diarized transcript, verbatim), then anything worth asking about,
// then each topic with its latest exact words. Claims come from the pure reconciler.
export default function Session() {
  const { liveTranscript } = usePatient();
  const { picture, live } = usePicture();

  // A live recording without its own transcript must NOT borrow the sample conversation — that would
  // attribute a stranger's words to the patient's own recording.
  const lines = live && !liveTranscript ? [] : transcriptView(liveTranscript ?? sessionTranscript);

  return (
    <>
      <TopBar href="/" />
      <main className="page">
        <header className="stack">
          <h1 className="t-display">Your recording</h1>
          {!live ? <span className="pill pill--plain">Sample recording</span> : null}
        </header>

        {picture.questions.length > 0 ? (
          <section className="stack">
            <SectionHead title="Worth asking about" />
            {picture.questions.map((q) => (
              <Link key={q.id} href="/questions" className="ask-card">
                <span className="ask-card__text">
                  <span className="ask-card__title">{q.prompt}</span>
                </span>
              </Link>
            ))}
          </section>
        ) : null}

        {lines.length > 0 ? (
          <section className="stack stack--lg">
            <SectionHead title="What was said" sub="Word for word, in order" />
            <ol className="transcript">
              {lines.map((l) => (
                <li key={l.id} className="turn">
                  <span className={`turn__dot${l.index === 0 ? " turn__dot--1" : ""}`} aria-hidden="true">
                    {l.index + 1}
                  </span>
                  <div>
                    <span className="turn__speaker">{l.speaker}</span>
                    <p className="turn__text">{l.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="stack stack--lg">
          <SectionHead title="Topics" sub="Tap one to see everything said about it" />
          {picture.entries.length === 0 ? (
            <p className="t-body muted">Nothing about your care was picked out of this recording.</p>
          ) : (
            picture.entries.map((e) => (
              <div key={e.id} className="stack">
                <div className="stack stack--tight">
                  <h3 className="t-title cap">{subjectLabel(e.subject)}</h3>
                  <StatusPill status={e.status} />
                </div>
                <Said claim={e.latest} clamp href={`/topic/${e.id}`} />
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
