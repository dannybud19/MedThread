"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MicIcon, PauseIcon, PlayIcon } from "../../components/icons";
import { HoldToConfirm, TopBar, Working } from "../../components/ui";
import { sendAudio } from "../../lib/api";
import { actions } from "../../lib/store";

// Record (LIVE). Captures microphone audio in the browser (MediaRecorder), sends it to /api/extract on
// hold-to-stop, then shows the result. A failed upload keeps the recording in memory, so "Try again"
// resends the same take instead of asking the patient to re-record a conversation that's over.
type Phase = "ready" | "starting" | "recording" | "sending" | "error";

const BARS = 28;

function pickMime(): string {
  for (const m of ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

function fileNameFor(mime: string): string {
  return mime.startsWith("audio/mp4") ? "recording.m4a" : "recording.webm";
}

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Record() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [kept, setKept] = useState<Blob | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const banked = useRef(0);
  const segmentStart = useRef(0);
  const raf = useRef<number | null>(null);
  const pausedRef = useRef(false);

  function teardown() {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    void audioCtx.current?.close().catch(() => {});
    stream.current = null;
    audioCtx.current = null;
  }

  useEffect(() => teardown, []);

  async function start() {
    setPhase("starting");
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't record audio.");
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mime = pickMime();
      const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.start(1000);
      recorder.current = rec;

      // Level meter: a gentle bar graph that shows the microphone is hearing the room.
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(s).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let last = 0;
      const loop = (now: number) => {
        raf.current = requestAnimationFrame(loop);
        if (!pausedRef.current) setElapsed(banked.current + (Date.now() - segmentStart.current));
        if (now - last < 80) return;
        last = now;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const level = pausedRef.current ? 0 : Math.min(1, Math.sqrt(sum / buf.length) * 6);
        setLevels((prev) => [...prev.slice(1), level]);
      };

      banked.current = 0;
      segmentStart.current = Date.now();
      pausedRef.current = false;
      setPaused(false);
      setPhase("recording");
      raf.current = requestAnimationFrame(loop);
    } catch (e) {
      teardown();
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(
        denied
          ? "MedThread needs your permission to use the microphone. Allow it in your browser, then try again."
          : e instanceof Error
            ? e.message
            : "The microphone couldn't start.",
      );
      setPhase("error");
    }
  }

  function togglePause() {
    const rec = recorder.current;
    if (!rec) return;
    if (pausedRef.current) {
      rec.resume();
      segmentStart.current = Date.now();
      pausedRef.current = false;
      setPaused(false);
    } else {
      rec.pause();
      banked.current += Date.now() - segmentStart.current;
      setElapsed(banked.current);
      pausedRef.current = true;
      setPaused(true);
    }
  }

  async function upload(blob: Blob) {
    setPhase("sending");
    try {
      const result = await sendAudio(blob, fileNameFor(blob.type));
      setKept(null);
      actions.setLiveCapture(result.claims, result.turns);
      router.replace("/session");
    } catch (e) {
      setKept(blob);
      setError(e instanceof Error ? e.message : "The recording couldn't be sent.");
      setPhase("error");
    }
  }

  async function finish() {
    const rec = recorder.current;
    if (!rec) return;
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    rec.stop();
    await stopped;
    const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
    teardown();
    recorder.current = null;
    if (blob.size === 0) {
      setError("No sound was captured.");
      setPhase("error");
      return;
    }
    await upload(blob);
  }

  if (phase === "sending") {
    return (
      <main className="page page--bare page--center">
        <Working title="Writing it down…" sub="This takes a few seconds." />
      </main>
    );
  }

  if (phase === "error") {
    return (
      <>
        <TopBar href="/" />
        <main className="page page--bare">
          <h1 className="t-display">{kept ? "We couldn't send that recording" : "Recording didn't start"}</h1>
          <p className="t-body muted">{error}</p>
          {kept ? <p className="t-body">Your recording is kept on this page. You can send it again.</p> : null}
          <div className="stack">
            <button type="button" className="btn btn--primary" onClick={() => (kept ? void upload(kept) : void start())}>
              {kept ? "Send it again" : "Try again"}
            </button>
            {kept ? (
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => {
                  setKept(null);
                  setPhase("ready");
                }}
              >
                Delete it and record again
              </button>
            ) : null}
          </div>
        </main>
      </>
    );
  }

  if (phase === "ready" || phase === "starting") {
    return (
      <>
        <TopBar href="/" />
        <main className="page page--bare">
          <header className="stack">
            <h1 className="t-display">Record a conversation</h1>
            <p className="t-body muted">
              When a doctor, nurse or pharmacist comes to your bed. Let them know you&apos;re recording.
            </p>
          </header>
          <div className="rec">
            <button
              type="button"
              className="btn btn--primary mic-start"
              onClick={() => void start()}
              disabled={phase === "starting"}
              aria-label="Start recording"
            >
              <MicIcon size={48} />
            </button>
            <p className="t-label">{phase === "starting" ? "Starting the microphone…" : "Tap to start"}</p>
          </div>
        </main>
      </>
    );
  }

  // recording
  return (
    <>
      <TopBar onBack={() => setConfirmLeave(true)} />
      <main className="page page--bare">
        {confirmLeave ? (
          <div className="sheet" role="alertdialog" aria-labelledby="leave-title">
            <h2 id="leave-title" className="t-heading">
              Stop and leave?
            </h2>
            <p className="t-body muted">This recording won&apos;t be kept.</p>
            <button type="button" className="btn btn--primary" onClick={() => setConfirmLeave(false)}>
              Keep recording
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                teardown();
                router.push("/");
              }}
            >
              Stop and leave
            </button>
          </div>
        ) : null}

        <div className="rec">
          <span className="rec__state" aria-live="polite">
            <span className={`rec__live${paused ? " rec__live--paused" : ""}`} aria-hidden="true" />
            {paused ? "Paused" : "Recording"}
          </span>
          <span className="rec__clock" aria-label={`${formatClock(elapsed)} recorded`}>
            {formatClock(elapsed)}
          </span>
          <div className={`meter${paused ? " meter--paused" : ""}`} aria-hidden="true">
            {levels.map((l, i) => (
              <span key={i} className="meter__bar" style={{ height: `${8 + l * 88}px` }} />
            ))}
          </div>
          <div className="rec__controls">
            <HoldToConfirm tone="stop" label="Hold to finish" onComplete={() => void finish()} />
            <button type="button" className="btn btn--secondary" onClick={togglePause}>
              {paused ? <PlayIcon size={24} /> : <PauseIcon size={24} />}
              {paused ? "Carry on recording" : "Pause"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
