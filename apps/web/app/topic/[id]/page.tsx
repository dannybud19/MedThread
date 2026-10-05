"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { StatusPill, Said, SectionHead, TopBar } from "../../../components/ui";
import { explain, type Explanation } from "../../../lib/api";
import { subjectLabel } from "../../../lib/data";
import { explainSubject } from "../../../lib/explain";
import { usePicture } from "../../../lib/store";

// One topic, drilled down. The clinicians' VERBATIM words, in order, are the page. The plain-language
// explanation is opt-in and clearly marked, and never blended with what was said:
//   - a MEDICINE gets general web information via /api/explain, labelled "not from your care team";
//   - other jargon gets the local canned explanation ("explains the words only").
type ExplainState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: Explanation }
  | { status: "error"; message: string };

export default function Topic() {
  const { id } = useParams<{ id: string }>();
  const { picture } = usePicture();
  const entry = picture.entries.find((e) => e.id === decodeURIComponent(id));
  const [open, setOpen] = useState(false);
  const [web, setWeb] = useState<ExplainState>({ status: "idle" });

  if (!entry) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1 className="t-display">We couldn&apos;t find that</h1>
          <p className="t-body muted">Go back and choose something from the list.</p>
        </main>
      </>
    );
  }

  const isMedicine = entry.category === "medication-dose" || entry.category === "medication-change";
  const canned = explainSubject(entry.subject);

  async function lookUp() {
    if (!entry) return;
    setWeb({ status: "loading" });
    try {
      setWeb({ status: "done", result: await explain(entry.subject, entry.latest.verbatimText) });
    } catch (e) {
      setWeb({ status: "error", message: e instanceof Error ? e.message : "Couldn't look this up." });
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && isMedicine && web.status === "idle") void lookUp();
  }

  // Oldest first: the trail reads as the story of what you were told.
  const trail = [...entry.trail].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));

  return (
    <>
      <TopBar />
      <main className="page">
        <header className="stack">
          <h1 className="t-display cap">{subjectLabel(entry.subject)}</h1>
          <StatusPill status={entry.status} />
        </header>

        {entry.confirmation ? (
          <div className="card">
            <p className="t-small muted">You confirmed</p>
            <p className="t-body strong">
              {entry.confirmation.confirmedValue}
            </p>
          </div>
        ) : null}

        <section className="stack">
          <SectionHead
            title="What you were told"
            sub={trail.length > 1 ? `${trail.length} times, oldest first` : undefined}
          />
          {trail.map((c) => (
            <Said key={c.id} claim={c} />
          ))}
        </section>

        <section className="stack">
          <button type="button" className="btn btn--secondary" aria-expanded={open} onClick={toggle}>
            {open ? "Hide explanation" : "What does this mean?"}
          </button>

          {open ? (
            isMedicine ? (
              <div className="explain" aria-live="polite">
                <p className="explain__label">General information from the web. Not from your care team, and not medical advice.</p>
                {web.status === "loading" ? (
                  <p className="t-body">Looking this up…</p>
                ) : web.status === "error" ? (
                  <>
                    <p className="t-body">Couldn&apos;t look this up right now.</p>
                    <button type="button" className="link" onClick={() => void lookUp()}>
                      Try again
                    </button>
                  </>
                ) : web.status === "done" && web.result ? (
                  <>
                    <p className="t-body">{web.result.text}</p>
                    <p className="t-small strong">
                      Where this comes from
                    </p>
                    {web.result.sources.map((s) => (
                      <a key={s.url} className="link" href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ))}
                  </>
                ) : web.status === "done" ? (
                  <p className="t-body">No reliable general information was found about this medicine.</p>
                ) : null}
              </div>
            ) : (
              <div className="explain">
                <p className="explain__label">Plain-language explanation. It explains the words only.</p>
                <p className="t-body">{canned ?? "There's no plain-language explanation for this yet."}</p>
              </div>
            )
          ) : null}
        </section>
      </main>
    </>
  );
}
