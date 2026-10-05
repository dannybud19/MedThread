"use client";

/**
 * The patient's session state, kept in the browser (localStorage) so a page refresh doesn't lose it.
 *
 * Two kinds of data live here, kept apart on purpose:
 *   - the latest LIVE capture result (claims + transcript returned by the server) and the discharge
 *     flag — the "what was said" side, always verbatim from the API;
 *   - the patient's OWN input: reminder clock times, mood check-ins, "I took it" records. None of it
 *     is a medical fact the app authored; it is stored only to show back and remind.
 *
 * No AI, no network. Reads never throw: missing or corrupt storage falls back to the empty state.
 */
import { useMemo, useSyncExternalStore } from "react";
import type { Claim } from "@medthread/domain";
import { buildPicture, fixturePicture, type Picture, type TranscriptTurn } from "./data";

export type Mood = "very-good" | "good" | "okay" | "not-great" | "poor";

export interface MoodCheckIn {
  id: string;
  mood: Mood;
  notedAt: string;
}

export interface IntakeRecord {
  id: string;
  subject: string;
  slot: number;
  takenAt: string;
}

/** A clock time the PATIENT set for a dose slot ("8:00 am"). Never inferred by the app. */
export type ReminderTimes = Record<string, string>;

export interface PatientState {
  liveClaims: Claim[] | null;
  liveTranscript: TranscriptTurn[] | null;
  discharged: boolean;
  reminderTimes: ReminderTimes;
  moods: MoodCheckIn[];
  intake: IntakeRecord[];
}

const EMPTY: PatientState = {
  liveClaims: null,
  liveTranscript: null,
  discharged: false,
  reminderTimes: {},
  moods: [],
  intake: [],
};

const KEY = "medthread.v1";
const listeners = new Set<() => void>();
let current: PatientState | null = null;

function load(): PatientState {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<PatientState>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function snapshot(): PatientState {
  if (current === null) current = load();
  return current;
}

function update(fn: (s: PatientState) => PatientState): void {
  current = fn(snapshot());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode / quota: the state still lives for this tab, it just won't survive a refresh.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePatient(): PatientState {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** The picture the pages show: this session's live capture when there is one, else the sample stay. */
export function usePicture(): { picture: Picture; live: boolean } {
  const { liveClaims } = usePatient();
  return useMemo(
    () => (liveClaims ? { picture: buildPicture(liveClaims), live: true } : { picture: fixturePicture, live: false }),
    [liveClaims],
  );
}

/** Stable key for one dose slot of one medication. */
export function slotKey(subject: string, slot: number): string {
  return `${subject}#${slot}`;
}

export const actions = {
  setLiveCapture(claims: Claim[], transcript: TranscriptTurn[] | null): void {
    update((s) => ({ ...s, liveClaims: claims, liveTranscript: transcript }));
  },
  setDischarged(discharged: boolean): void {
    update((s) => ({ ...s, discharged }));
  },
  /** Back to the sample stay: forget the live capture and the discharge flag (keeps the patient's own data). */
  resetDemo(): void {
    update((s) => ({ ...s, liveClaims: null, liveTranscript: null, discharged: false }));
  },
  setReminderTime(subject: string, slot: number, time: string): void {
    update((s) => ({ ...s, reminderTimes: { ...s.reminderTimes, [slotKey(subject, slot)]: time } }));
  },
  addMood(mood: Mood): void {
    const entry: MoodCheckIn = { id: `mood-${Date.now()}`, mood, notedAt: new Date().toISOString() };
    update((s) => ({ ...s, moods: [entry, ...s.moods] }));
  },
  addIntake(subject: string, slot: number): void {
    const entry: IntakeRecord = { id: `intake-${Date.now()}`, subject, slot, takenAt: new Date().toISOString() };
    update((s) => ({ ...s, intake: [entry, ...s.intake] }));
  },
};
