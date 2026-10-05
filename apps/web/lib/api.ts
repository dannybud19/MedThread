/**
 * Browser calls to this app's own Route Handlers (same origin — no API URL to configure). All AI runs
 * behind these routes, server-side; this file only POSTs and parses. Each call throws a plain-language
 * Error on failure so the page can say what happened.
 */
import type { AskResponse, Claim, ClaimGroup, GeneratedQuestion } from "@medthread/domain";
import type { TranscriptTurn } from "./data";

export const PATIENT_ID = "synthetic-patient-1";

async function readJson<T>(res: Response): Promise<T & { message?: string; error?: string }> {
  try {
    return (await res.json()) as T & { message?: string; error?: string };
  } catch {
    throw new Error(`The server sent an unreadable reply (${res.status}).`);
  }
}

type RawTurn = { atMs: number; role: string; roleConfidence: string; verbatimText: string };

/** Recording → /api/extract. Returns verbatim claims and the diarized transcript. */
export async function sendAudio(audio: Blob, fileName: string): Promise<{ claims: Claim[]; turns: TranscriptTurn[] }> {
  const form = new FormData();
  form.append("audio", audio, fileName);
  form.append("patientId", PATIENT_ID);
  form.append("recordingId", `rec-${Date.now()}`);
  const res = await fetch("/api/extract", { method: "POST", body: form });
  const data = await readJson<{ claims?: Claim[]; turns?: RawTurn[] }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? `The recording couldn't be processed (${res.status}).`);
  return {
    claims: data.claims ?? [],
    turns: (data.turns ?? []).map((t) => ({
      atMs: t.atMs,
      speaker: { role: t.role, roleConfidence: t.roleConfidence },
      verbatimText: t.verbatimText,
    })),
  };
}

/** Photo or PDF → /api/extract-document. Returns verbatim, document-sourced claims. */
export async function sendDocument(file: File): Promise<{ claims: Claim[] }> {
  const form = new FormData();
  form.append("image", file, file.name);
  form.append("patientId", PATIENT_ID);
  form.append("documentId", `doc-${Date.now()}`);
  const res = await fetch("/api/extract-document", { method: "POST", body: form });
  const data = await readJson<{ claims?: Claim[] }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? `The document couldn't be read (${res.status}).`);
  return { claims: data.claims ?? [] };
}

/** Retrieval-only Q&A. The route enforces the no_source guard (D18). */
export async function ask(question: string, groups: ClaimGroup[]): Promise<AskResponse> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, groups }),
  });
  const data = await readJson<AskResponse>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? `No answer came back (${res.status}).`);
  return data;
}

/** Grounded questions to ask a clinician. */
export async function generateQuestions(groups: ClaimGroup[]): Promise<GeneratedQuestion[]> {
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groups }),
  });
  const data = await readJson<{ questions?: GeneratedQuestion[] }>(res);
  if (!res.ok || !Array.isArray(data.questions)) throw new Error("No questions came back.");
  return data.questions;
}

export type Explanation = { text: string; sources: Array<{ title: string; url: string }> } | null;

/** General, attributed web info about a medicine. `null` = no reliable, sourced info was found. */
export async function explain(subject: string, verbatimText: string): Promise<Explanation> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, verbatimText }),
  });
  const data = await readJson<{ explanation?: string; sources?: Array<{ title: string; url: string }> }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Couldn't look this up (${res.status}).`);
  // No attributed source → no reliable info. Never show an unsourced medical statement.
  if (!data.explanation || !data.sources?.length) return null;
  return { text: data.explanation, sources: data.sources };
}
