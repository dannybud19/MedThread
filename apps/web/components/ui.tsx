"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Claim, ClaimGroupStatus } from "@medthread/domain";
import { sourceWhen, sourceWho, speakerRole } from "../lib/data";
import { BackIcon, ChevronIcon } from "./icons";

/** Sticky top bar with a labelled Back control. `href` makes Back go somewhere fixed. */
export function TopBar({ title, href, onBack }: { title?: string; href?: string; onBack?: () => void }) {
  const router = useRouter();
  const back = (
    <>
      <BackIcon />
      Back
    </>
  );
  return (
    <header className="topbar">
      {href ? (
        <Link className="back" href={href}>
          {back}
        </Link>
      ) : (
        <button type="button" className="back" onClick={onBack ?? (() => router.back())}>
          {back}
        </button>
      )}
      {title ? <span className="topbar__title">{title}</span> : null}
    </header>
  );
}

function initials(name: string): string {
  const words = name.replace(/^(Dr|Mr|Mrs|Ms|Nurse)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "?").toUpperCase();
}

/**
 * The signature element: one clinician's EXACT words, with who said it and when. The quote is never
 * paraphrased; the provenance is always shown beneath it. Pass `href` to make the whole card a link.
 */
export function Said({
  claim,
  href,
  clamp = false,
  children,
}: {
  claim: Claim;
  href?: string;
  clamp?: boolean;
  children?: ReactNode;
}) {
  const who = sourceWho(claim.source);
  const role = claim.source.kind === "audio" ? speakerRole(claim.source.speaker) : null;
  const paper = claim.source.kind === "document";
  const body = (
    <>
      <span className="said__who">
        <span className={`badge-avatar${paper ? " badge-avatar--paper" : ""}`} aria-hidden="true">
          {paper ? "Doc" : initials(who)}
        </span>
        <span>
          <span className="said__name">{who}</span>
          {role ? <span className="said__role">{role}</span> : null}
        </span>
      </span>
      <span className="said__quote-wrap">
        <q className={`said__quote${clamp ? " said__quote--clamp" : ""}`}>
          {claim.verbatimText}
        </q>
      </span>
      <span className="said__when">{sourceWhen(claim.source, claim.observedAt)}</span>
      {children}
    </>
  );
  return href ? (
    <Link className="said" href={href}>
      {body}
    </Link>
  ) : (
    <figure className="said">
      {body}
    </figure>
  );
}

/** Plain wording per reconciler status. Never phrased as an error, never red/green. */
export const STATUS_LABEL: Record<ClaimGroupStatus, string> = {
  agreed: "Everyone said the same thing",
  worth_confirming: "Worth asking about",
  uncorroborated: "Mentioned once",
};

export function StatusPill({ status }: { status: ClaimGroupStatus }) {
  return (
    <span className={`pill ${status === "worth_confirming" ? "pill--ask" : "pill--neutral"}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <nav className="rows">{children}</nav>;
}

export function Row({
  href,
  label,
  detail,
  icon,
}: {
  href: string;
  label: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <Link className="row" href={href}>
      {icon ? <span className="row__icon">{icon}</span> : null}
      <span className="row__text">
        <span className="row__label">{label}</span>
        {detail ? <span className="row__detail">{detail}</span> : null}
      </span>
      <span className="chev">
        <ChevronIcon />
      </span>
    </Link>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string | undefined }) {
  return (
    <div className="section-head">
      <h2 className="t-heading">{title}</h2>
      {sub ? <p className="t-small muted">{sub}</p> : null}
    </div>
  );
}

export function Working({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="status-screen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="t-title">{title}</p>
      <p className="t-body muted">{sub}</p>
    </div>
  );
}

/**
 * Press and hold for `ms` to confirm. For anything irreversible: a single accidental tap — easy with
 * a shaky hand — never completes it. Works with mouse, touch, and keyboard (hold Space or Enter).
 */
export function HoldToConfirm({
  label,
  onComplete,
  ms = 1500,
  tone = "plum",
}: {
  label: string;
  onComplete: () => void;
  ms?: number;
  tone?: "plum" | "stop";
}) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const done = useRef(onComplete);
  done.current = onComplete;

  function tick() {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / ms);
    setProgress(p);
    if (p >= 1) {
      start.current = null;
      setProgress(0);
      done.current();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  function begin() {
    if (start.current !== null) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }

  function cancel() {
    start.current = null;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    setProgress(0);
  }

  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      className={`hold${tone === "stop" ? " hold--stop" : ""}`}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={cancel}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`${label}. Press and hold.`}
    >
      <span className="hold__fill" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <span className="hold__label">{progress > 0 ? "Keep holding…" : label}</span>
    </button>
  );
}
