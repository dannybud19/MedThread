"use client";

import { Row, Rows, TopBar } from "../../components/ui";
import { encounters, formatDate, formatTime, speakerLabel, speakerRole, type Encounter } from "../../lib/data";

// Conversations — everyone who came to the bed, grouped by day, newest first.
export default function History() {
  const days = groupByDay(encounters);
  return (
    <>
      <TopBar href="/" />
      <main className="page">
        <h1 className="t-display">Conversations</h1>
        {days.length === 0 ? (
          <p className="t-body muted">Nothing has been recorded yet. Use Record when someone comes to your bed.</p>
        ) : (
          days.map((day) => (
            <section key={day.label} className="stack">
              <h2 className="t-heading">{day.label}</h2>
              <Rows>
                {day.items.map((e) => {
                  const role = speakerRole(e.speaker);
                  return (
                    <Row
                      key={e.id}
                      href={`/history/${e.id}`}
                      label={speakerLabel(e.speaker)}
                      detail={role ? `${role}, at ${formatTime(e.occurredAt)}` : `At ${formatTime(e.occurredAt)}`}
                    />
                  );
                })}
              </Rows>
            </section>
          ))
        )}
      </main>
    </>
  );
}

/** Bucket by calendar day (UTC, matching formatDate) — days newest first, and newest first within a day. */
function groupByDay(list: readonly Encounter[]): { label: string; items: Encounter[] }[] {
  const buckets = new Map<string, Encounter[]>();
  for (const e of list) {
    const key = e.occurredAt.slice(0, 10);
    buckets.set(key, [...(buckets.get(key) ?? []), e]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      label: formatDate(`${key}T00:00:00Z`),
      items: [...items].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
    }));
}
