import { BackLink } from "../components/BackLink";

/** Not yet designed — exists so tab-bar/tile links don't dead-end during review. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="screen">
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <BackLink to="/history" label="Back to History" />
      </div>
      <div className="section">
        <h1 className="h1">{title}</h1>
        <p className="body">Not built yet — next up.</p>
      </div>
    </div>
  );
}
