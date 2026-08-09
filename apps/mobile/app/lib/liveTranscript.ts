import type { TranscriptTurn } from "./data";
import type { RawTurn } from "./capture";

/**
 * In-memory handoff of a live recording's diarized transcript turns from the Recording screen to the
 * Session screen, so a real recording renders its OWN conversation as chat bubbles. Mirrors
 * `liveSession.ts`. `null` means "use the sample transcript fixture".
 */
let liveTranscript: TranscriptTurn[] | null = null;

/** Maps a raw /api/extract turn to the shared `TranscriptTurn` shape the session screen renders. */
export function toTranscriptTurn(t: RawTurn): TranscriptTurn {
  return {
    atMs: t.atMs,
    speaker: { role: t.role, roleConfidence: t.roleConfidence },
    verbatimText: t.verbatimText,
  };
}

export function setLiveTranscript(turns: TranscriptTurn[]): void {
  liveTranscript = turns;
}
export function getLiveTranscript(): TranscriptTurn[] | null {
  return liveTranscript;
}
export function clearLiveTranscript(): void {
  liveTranscript = null;
}
