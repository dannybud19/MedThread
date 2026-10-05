/**
 * Local, fully-offline data adapter for the patient web app.
 *
 * Imports the SYNTHETIC fixture JSON, validates it against the domain contract (fails loudly on
 * malformed data), runs the pure reconciler + view builders, and hands plain objects to the pages.
 * There is NO network and NO AI here (AGENTS.md §1.3, §1.4) — the client never imports @medthread/ai,
 * enforced by dependency-cruiser.
 */
import { ReconcileInput } from "@medthread/domain";
import type { AskResponse, Claim, ClaimGroup, ClaimSource, GeneratedQuestion } from "@medthread/domain";
import {
  buildMedicationSchedule,
  buildQuestions,
  buildRunningPicture,
  fixtures,
  reconcile,
  type DoseSlot,
  type Question,
  type RunningPictureEntry,
} from "@medthread/reconciler";
import sessionTranscriptRaw from "./fixtures/session-transcript.json";
import recoveryRaw from "./fixtures/recovery.json";

// Validate up front. A malformed fixture throws here rather than surfacing a half-built page.
const input = ReconcileInput.parse(fixtures.admission5day);

/** Stable, URL-safe id for a subject entry — used for navigation and lookups. */
export function entryId(category: string, subject: string): string {
  return `${category}__${subject}`;
}

/** Turn a normalized subject key ("cardiology-clinic") into readable words ("cardiology clinic"). */
export function subjectLabel(subject: string): string {
  return subject.replace(/-/g, " ");
}

/** A running-picture entry plus a stable id the router can address. */
export type PictureEntry = RunningPictureEntry & { id: string };

/** Everything the pages derive from one claim set, computed by the same pure reconciler. */
export type Picture = {
  claims: Claim[];
  groups: ClaimGroup[];
  entries: PictureEntry[];
  questions: Question[];
  /** Newest first. */
  newest: Claim[];
};

/** Reconcile an arbitrary claim set (a live recording OR the fixture). Fails loudly on bad data. */
export function buildPicture(claimsIn: Claim[]): Picture {
  const validated = ReconcileInput.parse({ claims: claimsIn, confirmations: [] });
  const groups = reconcile(validated);
  return {
    claims: validated.claims,
    groups,
    entries: buildRunningPicture(groups).map((e) => ({ ...e, id: entryId(e.category, e.subject) })),
    questions: buildQuestions(groups),
    newest: [...validated.claims].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)),
  };
}

const fixtureGroups = reconcile(input);

/** The sample admission, reconciled WITH its confirmations (the reminders depend on them, D5). */
export const fixturePicture: Picture = {
  claims: input.claims,
  groups: fixtureGroups,
  entries: buildRunningPicture(fixtureGroups).map((e) => ({ ...e, id: entryId(e.category, e.subject) })),
  questions: buildQuestions(fixtureGroups),
  newest: [...input.claims].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)),
};

/** The spoken (audio) claims — the base an uploaded document merges into (incl. aspirin 75mg). */
export const audioClaims: Claim[] = input.claims.filter((c) => c.source.kind === "audio");

// ---------------------------------------------------------------------------------------------
// Presentation helpers (pure formatting of verbatim provenance — never interpretation).
// ---------------------------------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const ROLE_LABEL: Record<string, string> = {
  consultant: "Consultant",
  registrar: "Registrar",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  physio: "Physiotherapist",
  patient: "You",
  other: "Someone at the bedside",
  unknown: "Someone at the bedside",
};

/** e.g. "8 Jun 2026". Uses UTC so the same fixture reads identically everywhere. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ""} ${d.getUTCFullYear()}`;
}

/** "09:10" in UTC. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** "Tuesday 8 June" in the viewer's own time zone — for today's header only. */
export function longToday(now: Date): string {
  const month = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(now);
  return `${WEEKDAYS[now.getDay()] ?? ""} ${now.getDate()} ${month}`;
}

/** Readable speaker for a claim/turn ("Dr Adeyemi" or the role label). */
export function speakerLabel(speaker: { role: string; label?: string | undefined }): string {
  return speaker.label ?? ROLE_LABEL[speaker.role] ?? "Someone at the bedside";
}

/** Role word shown under a named speaker ("Consultant"), or null when the name already is the role. */
export function speakerRole(speaker: { role: string; label?: string | undefined }): string | null {
  if (!speaker.label) return null;
  return ROLE_LABEL[speaker.role] ?? null;
}

/** Who said it, for any source. A document has no speaker — it was on paper. */
export function sourceWho(source: ClaimSource): string {
  return source.kind === "audio" ? speakerLabel(source.speaker) : "Written on a document";
}

/** How and when it reached the patient. */
export function sourceWhen(source: ClaimSource, observedAt: string): string {
  return source.kind === "audio"
    ? `Said on ${formatDate(observedAt)} at ${formatTime(observedAt)}`
    : `Page ${source.page}, received ${formatDate(observedAt)}`;
}

// ---------------------------------------------------------------------------------------------
// Fixture selectors.
// ---------------------------------------------------------------------------------------------

const claimsById: Record<string, Claim> = Object.fromEntries(input.claims.map((c) => [c.id, c]));

export function getClaim(id: string, extra: Claim[] = []): Claim | undefined {
  return extra.find((c) => c.id === id) ?? claimsById[id];
}

/** A diarized transcript turn. */
export type TranscriptTurn = {
  atMs: number;
  speaker: { role: string; roleConfidence: string; label?: string };
  verbatimText: string;
};

export const sessionTranscript: TranscriptTurn[] = sessionTranscriptRaw.turns;

export type TranscriptLine = { id: string; speaker: string; index: number; text: string };

/**
 * Map diarized turns to "Speaker 1 / Speaker 2" lines, numbered in first-appearance order. The label
 * stays generic so the transcript never attributes clinical authority. Verbatim text only.
 */
export function transcriptView(turns: TranscriptTurn[]): TranscriptLine[] {
  const order: string[] = [];
  return turns.map((t, i) => {
    const key = t.speaker.label ?? t.speaker.role;
    let idx = order.indexOf(key);
    if (idx === -1) {
      idx = order.length;
      order.push(key);
    }
    return { id: `turn-${i}`, speaker: `Speaker ${idx + 1}`, index: idx, text: t.verbatimText };
  });
}

export const encounters = fixtures.patientContexts.inpatient.encounters;
export type Encounter = (typeof encounters)[number];

export function getEncounter(id: string): Encounter | undefined {
  return encounters.find((e) => e.id === id);
}

/** The three AskResponse fixture variants (answered | partial | no_source), for the offline fallback. */
export const askResponses = fixtures.askResponses as Record<"answered" | "partial" | "no_source", AskResponse>;

export const generatedQuestionsFallback = fixtures.generatedQuestions.questions as GeneratedQuestion[];

export const patientName: string = recoveryRaw.patientName;

/** The state of a medication row. Only a `scheduled` row can ever become a real reminder. */
export type DueMedStatus = "scheduled" | "needs_confirming" | "ask_frequency";

/**
 * A medication row, DERIVED from the reconciler. `scheduled` only when the patient has confirmed the
 * dose (D5) AND its frequency parsed from the confirmed value. Otherwise it is a knowledge gap, never
 * a fabricated reminder. Clock times are the patient's own, set later.
 */
export type DueMedRow = {
  id: string;
  subject: string;
  claim: Claim;
  status: DueMedStatus;
  slots: DoseSlot[];
};

const medicationSchedule = buildMedicationSchedule(fixtureGroups);

export const dueMedications: DueMedRow[] = [
  ...medicationSchedule.reminders.map((r): DueMedRow => {
    const claim = claimsById[r.fromClaimId];
    if (!claim) {
      // Fail loudly — a reminder must always trace to a real confirmed claim (provenance).
      throw new Error(`buildMedicationSchedule: reminder "${r.subject}" references unknown claim "${r.fromClaimId}"`);
    }
    return { id: `due-${r.subject}`, subject: r.subject, claim, status: "scheduled", slots: r.slots };
  }),
  ...medicationSchedule.gaps.map((g): DueMedRow => ({
    id: `gap-${g.subject}`,
    subject: g.subject,
    claim: g.fromClaims[g.fromClaims.length - 1]!,
    status: g.reason === "no_frequency" ? "ask_frequency" : "needs_confirming",
    slots: [],
  })),
];

export const MED_STATUS_TEXT: Record<DueMedStatus, string> = {
  scheduled: "You confirmed this",
  needs_confirming: "Not confirmed yet",
  ask_frequency: "Ask how often",
};

/** A friendly "how often" label from parsed dose slots — verbatim-derived, never a clock time. */
export function scheduleLabel(slots: DoseSlot[]): string {
  const labels = slots.filter((s) => s.label).map((s) => s.label!);
  if (labels.length > 0 && labels.length === slots.length) {
    return labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(" and ");
  }
  const n = slots.length;
  return n === 1 ? "Once a day" : n === 2 ? "Twice a day" : `${n} times a day`;
}

export type { Claim, Question };
