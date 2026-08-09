export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640 }}>
      <h1>MedThread — backend</h1>
      <p>
        This service runs all AI (extraction, explanation) and serves reconciled, verbatim,
        provenance-anchored data to the patient mobile app. It never assesses, diagnoses, or advises.
      </p>
      <ul>
        <li>
          <code>POST /api/extract</code> — audio → verbatim Claims (Scribe + Claude)
        </li>
        <li>
          <code>POST /api/extract-document</code> — photo/PDF → verbatim Claims (Claude vision)
        </li>
        <li>
          <code>POST /api/ask</code> — retrieval-only Q&amp;A over existing Claims
        </li>
        <li>
          <code>POST /api/questions</code> — grounded questions to ask a clinician
        </li>
        <li>
          <code>POST /api/explain</code> — on-demand plain-language explanation (Claude + web search)
        </li>
        <li>
          <code>POST /api/ingest</code> — unified capture ingest → verbatim Claims (stub)
        </li>
      </ul>
    </main>
  );
}
