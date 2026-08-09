import { describe, expect, it } from "vitest";
import { buildTurns, locate } from "./claude";
import type { TranscriptWord } from "../types";

// Pure, network-free coverage of the two helpers that decide what becomes provenance. The live
// Claude call itself stays a live-only concern (PROJECT.md "Known gaps"). buildTurns groups the
// raw diarized words the extractor prompts Claude with; locate is the fail-loudly guard that
// refuses to store a Claim whose verbatimText isn't a real, exact span of its turn (never a
// paraphrase — AGENTS.md §1.2).

const w = (text: string, startMs: number, endMs: number, speaker?: string): TranscriptWord => ({
  text,
  startMs,
  endMs,
  ...(speaker ? { speaker } : {}),
});

describe("buildTurns", () => {
  it("groups consecutive same-speaker words into one turn", () => {
    const turns = buildTurns([
      w("Take", 0, 100, "speaker_0"),
      w("aspirin", 100, 300, "speaker_0"),
      w("daily.", 300, 500, "speaker_0"),
    ]);
    expect(turns).toEqual([
      {
        turnIndex: 0,
        speakerId: "speaker_0",
        words: [w("Take", 0, 100, "speaker_0"), w("aspirin", 100, 300, "speaker_0"), w("daily.", 300, 500, "speaker_0")],
        text: "Take aspirin daily.",
      },
    ]);
  });

  it("splits into a new turn on a speaker change, with sequential turnIndex", () => {
    const turns = buildTurns([
      w("Hello", 0, 100, "speaker_0"),
      w("Hi", 200, 300, "speaker_1"),
      w("there", 300, 400, "speaker_1"),
      w("OK", 500, 600, "speaker_0"),
    ]);
    expect(turns.map((t) => [t.turnIndex, t.speakerId, t.text])).toEqual([
      [0, "speaker_0", "Hello"],
      [1, "speaker_1", "Hi there"],
      [2, "speaker_0", "OK"],
    ]);
  });

  it("defaults a missing speaker to speaker_0", () => {
    const turns = buildTurns([w("word", 0, 100)]);
    expect(turns).toEqual([{ turnIndex: 0, speakerId: "speaker_0", words: [w("word", 0, 100)], text: "word" }]);
  });

  it("returns an empty array for an empty transcript", () => {
    expect(buildTurns([])).toEqual([]);
  });
});

describe("locate", () => {
  const words = [w("Take", 0, 100), w("Aspirin,", 100, 300), w("75mg", 300, 500), w("once", 500, 600), w("daily.", 600, 800)];

  it("finds the exact contiguous span for a verbatim quote and returns its original tokens + timing", () => {
    const found = locate(words, "Aspirin, 75mg once daily.");
    expect(found).toEqual({ text: "Aspirin, 75mg once daily.", startMs: 100, endMs: 800 });
  });

  it("matches despite case/punctuation differences but returns the ORIGINAL text, not the normalized query", () => {
    const found = locate(words, "aspirin 75mg once daily");
    expect(found).toEqual({ text: "Aspirin, 75mg once daily.", startMs: 100, endMs: 800 });
  });

  it("finds a single-word span", () => {
    expect(locate(words, "75mg")).toEqual({ text: "75mg", startMs: 300, endMs: 500 });
  });

  it("returns null when the quote is not a real substring (guards fail-loudly)", () => {
    expect(locate(words, "150mg twice daily")).toBeNull();
  });

  it("returns null for an empty or whitespace-only quote", () => {
    expect(locate(words, "")).toBeNull();
    expect(locate(words, "   ")).toBeNull();
  });
});
