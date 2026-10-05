"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { CameraIcon, UploadIcon } from "../../components/icons";
import { Working } from "../../components/ui";
import { sendDocument } from "../../lib/api";
import { audioClaims } from "../../lib/data";
import { actions } from "../../lib/store";

// Papers (LIVE). Photograph or upload a letter or medication chart → /api/extract-document (Claude
// vision → verbatim, document-sourced claims), merged with what was said aloud. A processed document is
// treated as the discharge letter: the patient moves to "At home", where e.g. the letter's aspirin 150mg
// vs the spoken 75mg shows up as worth asking about. A failed send keeps the file so it can be resent.
type Phase = "idle" | "sending" | "error";

export default function Files() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [kept, setKept] = useState<File | null>(null);

  async function send(file: File) {
    setPhase("sending");
    try {
      const { claims } = await sendDocument(file);
      setKept(null);
      actions.setLiveCapture([...audioClaims, ...claims], null);
      actions.setDischarged(true);
      router.push("/recovery");
    } catch (e) {
      setKept(file);
      setError(e instanceof Error ? e.message : "The document couldn't be read.");
      setPhase("error");
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void send(file);
  }

  if (phase === "sending") {
    return (
      <main className="page page--center">
        <Working title="Reading your document…" sub="This takes a few seconds." />
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="page">
        <h1 className="t-display">We couldn&apos;t read that document</h1>
        <p className="t-body muted">{error}</p>
        <div className="stack">
          {kept ? (
            <button type="button" className="btn btn--primary" onClick={() => void send(kept)}>
              Send it again
            </button>
          ) : null}
          <button
            type="button"
            className={kept ? "btn btn--quiet" : "btn btn--primary"}
            onClick={() => {
              setKept(null);
              setPhase("idle");
            }}
          >
            Choose a different one
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="home-head">
        <h1 className="t-display">Your papers</h1>
        <p className="t-body muted">
          Letters and medication charts you were handed. We&apos;ll show you what they say, word for word.
        </p>
      </header>

      <div className="stack stack--lg">
        <label className="pick">
          <span className="row__icon">
            <CameraIcon />
          </span>
          <span className="row__text">
            <span className="row__label">Take a photo</span>
            <span className="row__detail">Of a letter or chart</span>
          </span>
          <input type="file" accept="image/*" capture="environment" onChange={onPick} />
        </label>
        <label className="pick">
          <span className="row__icon">
            <UploadIcon />
          </span>
          <span className="row__text">
            <span className="row__label">Choose a file</span>
            <span className="row__detail">A photo or PDF</span>
          </span>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" onChange={onPick} />
        </label>
      </div>
    </main>
  );
}
