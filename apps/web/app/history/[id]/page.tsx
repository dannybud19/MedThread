"use client";

import { useParams } from "next/navigation";
import { Said, SectionHead, TopBar } from "../../../components/ui";
import { entryId, formatDate, formatTime, getClaim, getEncounter, speakerLabel, speakerRole } from "../../../lib/data";

// One conversation: who, when, how long, and the exact words that were picked out of it.
export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const enc = getEncounter(id);

  if (!enc) {
    return (
      <>
        <TopBar href="/history" />
        <main className="page">
          <h1 className="t-display">We couldn&apos;t find that conversation</h1>
        </main>
      </>
    );
  }

  const role = speakerRole(enc.speaker);
  const minutes = Math.max(1, Math.round(enc.durationMs / 60000));
  const claims = enc.claimIds.map((cid) => getClaim(cid)).filter((c) => c !== undefined);

  return (
    <>
      <TopBar href="/history" />
      <main className="page">
        <header className="stack">
          <h1 className="t-display">{speakerLabel(enc.speaker)}</h1>
          <p className="t-body muted">
            {role ? `${role}. ` : ""}
            {formatDate(enc.occurredAt)} at {formatTime(enc.occurredAt)}, about {minutes} {minutes === 1 ? "minute" : "minutes"}.
          </p>
        </header>
        <section className="stack">
          <SectionHead title="What was said" />
          {claims.length === 0 ? (
            <p className="t-body muted">Nothing was picked out of this conversation.</p>
          ) : (
            claims.map((c) => <Said key={c.id} claim={c} href={`/topic/${entryId(c.category, c.subject)}`} />)
          )}
        </section>
      </main>
    </>
  );
}
