"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { entryId, MED_STATUS_TEXT, scheduleLabel, sourceWho, subjectLabel, type DueMedRow } from "../lib/data";
import { ChevronIcon } from "./icons";

/**
 * One medicine. The clinician's exact words are the body — never an app-written description of what
 * the drug is for. "You confirmed this" only when the patient confirmed the dose (D5); otherwise it's a
 * gap to resolve, never the app endorsing a dose.
 */
export function MedCard({ med, children }: { med: DueMedRow; children?: ReactNode }) {
  const scheduled = med.status === "scheduled";
  return (
    <article className="card">
      <Link
        href={`/topic/${entryId(med.claim.category, med.subject)}`}
        className="row row--flush"
      >
        <span className="row__text">
          <span className="t-title cap">{subjectLabel(med.subject)}</span>
          {scheduled ? <span className="row__detail">{scheduleLabel(med.slots)}</span> : null}
        </span>
        <span className="chev">
          <ChevronIcon />
        </span>
      </Link>
      <span className="said__quote-wrap">
        <q className="said__quote said__quote--clamp">{med.claim.verbatimText}</q>
      </span>
      <p className="said__when">{sourceWho(med.claim.source)}</p>
      <span className={`pill ${scheduled ? "pill--neutral" : "pill--ask"}`}>{MED_STATUS_TEXT[med.status]}</span>
      {children}
    </article>
  );
}
