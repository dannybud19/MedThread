/**
 * On-device queue for a capture (recording/document) whose upload failed. Mirrors `patientData.ts`'s
 * conventions (AsyncStorage, reads never throw) plus `expo-file-system` to durably copy the captured
 * file out of the volatile cache directory `recorder.uri`/the picker URI point into — that cache dir
 * isn't guaranteed to survive the app being backgrounded or killed mid-error.
 *
 * Scope (product decision): retry the WHOLE file, not a true HTTP-resumable/chunked upload; retry is
 * MANUAL only (on tap, or the next time the outbox is checked) — no background task. Both send calls
 * go through `capture.ts` so a first attempt and a retry run the exact same network code.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import type { Claim } from "@medthread/domain";
import { sendAudio, sendDocument, type RawTurn } from "./capture";

export type OutboxKind = "audio" | "document";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  /** Durable copy inside the outbox directory — NOT the original recorder/picker URI. */
  fileUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  recordingId?: string;
  documentId?: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const KEY = "medthread.outbox";

/** The app's persistent document directory. Throws loudly rather than silently doing nothing — this
 * is expected to be unavailable only on web, which isn't the outbox's real target (a browser tab
 * already loses in-memory state on reload; the offline-capture problem is native-only). */
function outboxDir(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("No persistent file storage is available on this platform.");
  }
  return `${FileSystem.documentDirectory}outbox/`;
}

async function readItems(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function writeItems(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

async function persistCopy(sourceUri: string, id: string, fileName: string): Promise<string> {
  const dir = outboxDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${id}-${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

interface EnqueueInput {
  kind: OutboxKind;
  sourceUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  recordingId?: string;
  documentId?: string;
}

async function enqueue(input: EnqueueInput): Promise<OutboxItem> {
  const id = `outbox-${Date.now()}`;
  const fileUri = await persistCopy(input.sourceUri, id, input.fileName);
  const item: OutboxItem = {
    id,
    kind: input.kind,
    fileUri,
    fileName: input.fileName,
    mimeType: input.mimeType,
    patientId: input.patientId,
    ...(input.recordingId ? { recordingId: input.recordingId } : {}),
    ...(input.documentId ? { documentId: input.documentId } : {}),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await writeItems([...(await readItems()), item]);
  return item;
}

/** Queues a recording whose /api/extract upload failed, so it can be resent without re-recording. */
export function enqueueAudio(input: {
  sourceUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  recordingId: string;
}): Promise<OutboxItem> {
  return enqueue({ ...input, kind: "audio" });
}

/** Queues a document whose /api/extract-document upload failed, so it can be resent without re-picking. */
export function enqueueDocument(input: {
  sourceUri: string;
  fileName: string;
  mimeType: string;
  patientId: string;
  documentId: string;
}): Promise<OutboxItem> {
  return enqueue({ ...input, kind: "document" });
}

/** All captures currently waiting to be resent, oldest first. Never throws (mirrors patientData.ts). */
export async function getPending(): Promise<OutboxItem[]> {
  return readItems();
}

async function removeItem(id: string): Promise<void> {
  const items = await readItems();
  const item = items.find((i) => i.id === id);
  await writeItems(items.filter((i) => i.id !== id));
  if (item) await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
}

/** Discards a queued item without retrying — the patient chose to redo the capture instead. */
export async function discard(id: string): Promise<void> {
  await removeItem(id);
}

async function recordFailure(id: string, message: string): Promise<void> {
  const items = await readItems();
  await writeItems(
    items.map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1, lastError: message } : i)),
  );
}

export type ResendResult =
  | { kind: "audio"; claims: Claim[]; turns: RawTurn[] }
  | { kind: "document"; claims: Claim[] };

/**
 * Re-attempts a queued item's upload through the same `capture.ts` send functions as a first
 * attempt. On success, removes the item (file + metadata) and returns its result. On failure,
 * records the attempt/error — the item stays queued — and rethrows so the caller shows the failure.
 */
export async function resendItem(item: OutboxItem): Promise<ResendResult> {
  const apiBase = process.env.EXPO_PUBLIC_API_URL;
  if (!apiBase) throw new Error("EXPO_PUBLIC_API_URL is not set.");
  try {
    if (item.kind === "audio") {
      const result = await sendAudio(
        {
          fileUri: item.fileUri,
          fileName: item.fileName,
          mimeType: item.mimeType,
          patientId: item.patientId,
          recordingId: item.recordingId ?? `rec-${Date.now()}`,
        },
        apiBase,
      );
      await removeItem(item.id);
      return { kind: "audio", ...result };
    }
    const result = await sendDocument(
      {
        fileUri: item.fileUri,
        fileName: item.fileName,
        mimeType: item.mimeType,
        patientId: item.patientId,
        documentId: item.documentId ?? `doc-${Date.now()}`,
      },
      apiBase,
    );
    await removeItem(item.id);
    return { kind: "document", ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong sending this.";
    await recordFailure(item.id, message);
    throw e;
  }
}
