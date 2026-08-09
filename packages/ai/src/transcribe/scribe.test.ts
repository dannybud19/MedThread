import { describe, expect, it } from "vitest";
import { parseScribeWords, speakerOf } from "./scribe";
import type { ScribeWord } from "./scribe";

// Pure, network-free coverage of Scribe's response parsing — the SDK call itself stays a live-only
// concern (PROJECT.md "Known gaps"). This is the boundary that turns raw ASR output into the
// TranscriptWord[] the extractor builds turns/claims from, so its filtering and rounding matter.

const word = (over: Partial<ScribeWord> = {}): ScribeWord => ({
  text: "hi",
  start: 0,
  end: 0.1,
  type: "word",
  ...over,
});

describe("speakerOf", () => {
  it("reads camelCase speakerId", () => {
    expect(speakerOf(word({ speakerId: "speaker_1" }))).toBe("speaker_1");
  });

  it("reads snake_case speaker_id when camelCase is absent", () => {
    expect(speakerOf(word({ speaker_id: "speaker_2" }))).toBe("speaker_2");
  });

  it("prefers camelCase when both are present", () => {
    expect(speakerOf(word({ speakerId: "speaker_1", speaker_id: "speaker_2" }))).toBe("speaker_1");
  });

  it("returns undefined when neither is present", () => {
    expect(speakerOf(word())).toBeUndefined();
  });
});

describe("parseScribeWords", () => {
  it("filters out non-word entries (spacing, audio_event)", () => {
    const out = parseScribeWords([
      word({ text: "Take", type: "word" }),
      word({ text: " ", type: "spacing" }),
      word({ text: "[cough]", type: "audio_event" }),
      word({ text: "aspirin", type: "word" }),
    ]);
    expect(out.map((w) => w.text)).toEqual(["Take", "aspirin"]);
  });

  it("converts seconds to rounded milliseconds", () => {
    const out = parseScribeWords([word({ start: 1.2345, end: 1.6789 })]);
    expect(out).toEqual([{ text: "hi", startMs: 1235, endMs: 1679 }]);
  });

  it("defaults start/end to 0 when null", () => {
    const out = parseScribeWords([word({ start: null, end: null })]);
    expect(out[0]).toMatchObject({ startMs: 0, endMs: 0 });
  });

  it("falls back endMs to start when end is null", () => {
    const out = parseScribeWords([word({ start: 2, end: null })]);
    expect(out[0]).toMatchObject({ startMs: 2000, endMs: 2000 });
  });

  it("carries the speaker id when present, omits the field entirely otherwise", () => {
    const withSpeaker = parseScribeWords([word({ speakerId: "speaker_0" })]);
    expect(withSpeaker[0]).toHaveProperty("speaker", "speaker_0");

    const withoutSpeaker = parseScribeWords([word()]);
    expect(withoutSpeaker[0]).not.toHaveProperty("speaker");
  });
});
