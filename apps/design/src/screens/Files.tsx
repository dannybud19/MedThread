import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackLink } from "../components/BackLink";
import { CameraIcon, GalleryIcon, CheckIcon } from "../icons";

type Phase = "idle" | "uploading" | "done";

/**
 * Visual/interaction redesign of the real upload screen (photo/PDF of a discharge letter or
 * medication chart → verbatim claims). No real camera/file access — a design prototype, not the
 * live app — but the phase model (idle → uploading → done) mirrors the real one.
 */
export function Files() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");

  function simulateUpload() {
    setPhase("uploading");
    setTimeout(() => setPhase("done"), 1200);
  }

  if (phase === "uploading") {
    return (
      <div className="screen">
        <div className="section" style={{ marginTop: "var(--space-xxl)", textAlign: "center" }}>
          <p className="h2">Reading your document…</p>
          <p className="body">This takes a few seconds.</p>
        </div>
      </div>
    );
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
            <h1 className="h1">Added to your history</h1>
            <p className="body">
              This looks like a discharge letter — we've added what it says, word for word, to your
              Recovery view.
            </p>
          </div>
        </div>
        <div className="section">
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/history")}>
            Go to Recovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <BackLink to="/history" label="Back to History" />
      </div>

      <div className="section">
        <div className="uploadhero">
          <CameraIcon size={88} strokeWidth={1.5} />
          <h1 className="h1">Your medical documents</h1>
          <p>
            Scans, letters and medication charts from your hospital stay. We'll show you what they
            say, word for word.
          </p>
        </div>
      </div>

      <div className="section">
        <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={simulateUpload}>
          Take a photo
        </button>
      </div>

      <div className="section">
        <div className="orrow">
          <span className="orrow__rule" />
          <span className="orrow__text">Or</span>
          <span className="orrow__rule" />
        </div>
      </div>

      <div className="section">
        <button type="button" className="filerow" onClick={simulateUpload}>
          <span className="filerow__icon" aria-hidden="true"><GalleryIcon size={28} /></span>
          <span>
            <span className="filerow__title" style={{ display: "block" }}>Upload your documents</span>
            <span className="filerow__hint">PNG, JPEG or PDF</span>
          </span>
        </button>
      </div>
    </div>
  );
}
