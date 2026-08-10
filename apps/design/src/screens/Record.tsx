import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronBackIcon, PauseIcon, PlayIcon, StopIcon, CheckIcon } from "../icons";

type Phase = "starting" | "recording" | "uploading" | "done";

const HOLD_MS = 1500;
const TODAY_LABEL = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The core capture flow — visual/interaction redesign only (no real microphone access; this is a
 * design prototype, not the live app). Preserves the actual app's distinctive elder-first pattern:
 * hold-to-stop (an accidental tap can't end a recording), pause/resume, and a confirm panel before
 * leaving mid-recording rather than a native browser dialog (consistent visual language throughout).
 */
export function Record() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("starting");
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("recording"), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "recording" || paused) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => setElapsedMs((ms) => ms + 100), 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase, paused]);

  function startHold() {
    if (phase !== "recording") return;
    const start = Date.now();
    holdRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        if (holdRef.current) clearInterval(holdRef.current);
        holdRef.current = null;
        setHoldProgress(0);
        setPhase("uploading");
        setTimeout(() => setPhase("done"), 1200);
      }
    }, 30);
  }
  function endHold() {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
    setHoldProgress(0);
  }

  function requestBack() {
    if (phase === "recording") setConfirmLeave(true);
    else navigate("/history");
  }

  if (phase === "done") {
    return (
      <div className="screen">
        <div className="section" style={{ marginTop: "var(--space-xxl)" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-sm)" }}>
              <span className="badge badge--confirmed" style={{ padding: "var(--space-sm)" }}>
                <CheckIcon size={20} strokeWidth={3} />
              </span>
            </div>
            <h1 className="h1">Saved</h1>
            <p className="body">This consultation has been added to your history.</p>
          </div>
        </div>
        <div className="section">
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/history")}>
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <button type="button" className="backlink" onClick={requestBack} style={{ background: "none", border: "none" }}>
          <ChevronBackIcon />
          <span>Back</span>
        </button>
      </div>

      {confirmLeave ? (
        <div className="section">
          <div className="confirm-panel" role="alertdialog" aria-label="Stop recording and leave?">
            <div className="confirm-panel__title">Stop recording and leave?</div>
            <div className="confirm-panel__body">This recording won't be saved.</div>
            <button type="button" className="btn btn-primary" onClick={() => setConfirmLeave(false)}>
              Keep recording
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/history")}>
              Stop and leave without saving
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="section">
            <p className="label" style={{ textAlign: "center" }}>{TODAY_LABEL}</p>
          </div>

          {phase === "uploading" ? (
            <div className="section" style={{ textAlign: "center", marginTop: "var(--space-xxl)" }}>
              <p className="h2">Transcribing…</p>
              <p className="body">This takes a few seconds.</p>
            </div>
          ) : (
            <>
              <div className="capture-stage">
                <div className={"capture-halo" + (phase === "recording" && !paused ? " capture-halo--listening" : "")} aria-hidden="true" />
                <div className="capture-controls">
                  <button
                    type="button"
                    className="capture-btn"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? "Resume recording" : "Pause recording"}
                    disabled={phase !== "recording"}
                  >
                    {paused ? <PlayIcon size={22} /> : <PauseIcon size={22} />}
                  </button>

                  <div className="capture-waveform" aria-hidden="true">
                    {[14, 22, 10, 26, 16, 20, 12].map((h, i) => (
                      <span key={i} style={{ height: phase === "recording" && !paused ? h : 6 }} />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="capture-stop"
                    onPointerDown={startHold}
                    onPointerUp={endHold}
                    onPointerLeave={endHold}
                    aria-label="Hold to stop recording"
                    style={{
                      background: `conic-gradient(var(--color-terracotta) ${holdProgress * 360}deg, var(--color-hairline) 0deg)`,
                    }}
                  >
                    <span className="capture-stop__core">
                      <StopIcon size={22} />
                    </span>
                  </button>
                </div>
              </div>

              <div className="capture-elapsed" aria-label={`${paused ? "Paused" : "Recording"}, elapsed time`}>
                {formatClock(elapsedMs)}
              </div>
              <p className="capture-status">
                {phase === "starting" ? "Starting the microphone…" : paused ? "Paused" : "Listening"}
              </p>
              <p className="label" style={{ textAlign: "center" }}>Hold the button to stop</p>

              <div className="section" style={{ marginTop: "var(--space-xl)", borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-md)" }}>
                {/* Live transcript area — intentionally empty, same as the real app: nothing here
                    can be mistaken for something a clinician actually said. */}
                <div style={{ minHeight: 120 }} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
