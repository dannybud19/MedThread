"use client";

import { Said, TopBar } from "../../components/ui";
import { entryId } from "../../lib/data";
import { usePicture } from "../../lib/store";

// Questions to ask. Each one comes from the reconciler: two people said different things about the same
// topic (D20). It names both values and asks which is current. It's a question to raise, never advice,
// and it never says who is right.
export default function Questions() {
  const { picture } = usePicture();
  const qs = picture.questions;
  return (
    <>
      <TopBar />
      <main className="page">
        <header className="stack">
          <h1 className="t-display">Questions to ask</h1>
          <p className="t-body muted">
            Where people told you different things. You could read these out to your doctor or nurse.
          </p>
        </header>

        {qs.length === 0 ? (
          <div className="ask-card ask-card--neutral">
            <span className="ask-card__text">
              <span className="ask-card__title">Nothing to ask about right now</span>
              <span className="ask-card__sub">Everyone has told you the same things so far.</span>
            </span>
          </div>
        ) : (
          qs.map((q) => (
            <section key={q.id} className="stack">
              <h2 className="t-heading">{q.prompt}</h2>
              {q.fromClaims.map((c) => (
                <Said key={c.id} claim={c} href={`/topic/${entryId(c.category, c.subject)}`} />
              ))}
            </section>
          ))
        )}
      </main>
    </>
  );
}
