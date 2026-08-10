import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon } from "../icons";

const HOLD_MS = 1500;

/**
 * Full-screen hold-to-confirm — opened from a notification tap (or the "Today's reminder" tile).
 * No tab bar here (see App.tsx) and no ordinary back control: the only way off this screen is
 * "Hold to confirm" or "Not now" — a notification you can swipe away without reading is one you
 * didn't read, so a stray tap can't dismiss this the way a bare back arrow would let it.
 */
export function ReminderConfirm() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startHold() {
    if (confirmed) return;
    const start = Date.now();
    holdRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        if (holdRef.current) clearInterval(holdRef.current);
        holdRef.current = null;
        setConfirmed(true);
      }
    }, 30);
  }
  function endHold() {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
    if (!confirmed) setProgress(0);
  }

  return (
    <div
      className="screen"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + var(--space-xl))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100dvh",
      }}
    >
      {confirmed ? (
        <div className="section" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-md)" }}>
            <span className="badge badge--confirmed" style={{ padding: "var(--space-md)" }}>
              <CheckIcon size={28} strokeWidth={3} />
            </span>
          </div>
          <h1 className="h1">Marked as taken</h1>
          <p className="body">Metformin, 500 milligrams — recorded just now.</p>
          <div style={{ marginTop: "var(--space-lg)" }}>
            <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/history")}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="section" style={{ textAlign: "center" }}>
            <p className="label">Time for your dose</p>
            <h1 className="h1">Metformin</h1>
            <p className="body">500 milligrams</p>
            <p className="body" style={{ color: "var(--color-inkMuted)", marginTop: "var(--space-sm)" }}>
              "And your metformin for the diabetes stays the same, 500 milligrams twice a day,
              morning and evening."
            </p>
          </div>

          <div className="section" style={{ marginTop: "var(--space-xl)" }}>
            <div className="holdconfirm__wrap">
              <button
                type="button"
                className="holdconfirm"
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                aria-label="Hold to confirm you've taken it"
                style={{
                  background: `conic-gradient(var(--color-terracotta) ${progress * 360}deg, var(--color-hairline) 0deg)`,
                }}
              >
                <span className="holdconfirm__core">
                  <CheckIcon size={32} strokeWidth={3} />
                  <span className="holdconfirm__label">Hold to confirm you've taken it</span>
                </span>
              </button>
            </div>
          </div>

          <div className="section" style={{ textAlign: "center" }}>
            <button type="button" className="demolink" onClick={() => navigate("/history")}>
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
