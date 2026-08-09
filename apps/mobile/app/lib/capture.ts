import { Platform } from "react-native";
import type { Claim } from "@medthread/domain";

/**
 * The actual network calls behind the two capture flows (record → /api/extract,
 * upload → /api/extract-document), extracted so the SAME code runs for a first attempt and for an
 * outbox retry (`lib/outbox.ts`) — no duplicated fetch/parse logic to drift between the two.
 */

/** Shape of one item in /api/extract's `turns` (the full diarized transcript, display-only). */
export type RawTurn = {
  atMs: number;
  role: string;
  roleConfidence: string;
  verbatimText: string;
};

export interface SendAudioInput {
  fileUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  recordingId: string;
}

/** POSTs a captured recording to /api/extract. Throws with a user-facing message on any failure. */
export async function sendAudio(
  input: SendAudioInput,
  apiBase: string,
): Promise<{ claims: Claim[]; turns: RawTurn[] }> {
  const { fileUri, fileName, mimeType, patientId, recordingId } = input;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(fileUri)).blob();
    form.append("audio", blob, fileName);
  } else {
    // React Native's FormData accepts a { uri, name, type } file descriptor.
    form.append("audio", { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
  }
  form.append("patientId", patientId);
  form.append("recordingId", recordingId);

  const res = await fetch(`${apiBase}/api/extract`, { method: "POST", body: form });
  const data = (await res.json()) as {
    claims?: unknown;
    turns?: RawTurn[];
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `Request failed (${res.status})`);
  }
  return { claims: (data.claims ?? []) as Claim[], turns: data.turns ?? [] };
}

export interface SendDocumentInput {
  fileUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  documentId: string;
}

/** POSTs a captured document to /api/extract-document. Throws with a user-facing message on any failure. */
export async function sendDocument(
  input: SendDocumentInput,
  apiBase: string,
): Promise<{ claims: Claim[] }> {
  const { fileUri, fileName, mimeType, patientId, documentId } = input;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(fileUri)).blob();
    form.append("image", blob, fileName);
  } else {
    form.append("image", { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
  }
  form.append("patientId", patientId);
  form.append("documentId", documentId);

  const res = await fetch(`${apiBase}/api/extract-document`, { method: "POST", body: form });
  const data = (await res.json()) as { claims?: unknown; message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `Request failed (${res.status})`);
  }
  return { claims: (data.claims ?? []) as Claim[] };
}
