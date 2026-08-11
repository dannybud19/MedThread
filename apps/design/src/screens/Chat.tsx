import { useState } from "react";
import { Link } from "react-router-dom";
import { BackLink } from "../components/BackLink";
import { SendIcon, QuestionIcon } from "../icons";

type Message =
  | { id: string; kind: "patient"; text: string }
  | { id: string; kind: "assistant"; text: string; citation: { speaker: string; when: string } };

const SUGGESTIONS = ["What's the water tablet for?", "When can I go home?", "What does aspirin do?"];

const INITIAL_MESSAGES: Message[] = [
  { id: "m1", kind: "patient", text: "What's the water tablet for?" },
  {
    id: "m2",
    kind: "assistant",
    text: "It's a diuretic — it helps your body get rid of extra fluid. Your team mentioned starting it to help with some fluid seen on your scan.",
    citation: { speaker: "Dr Kelly", when: "Today, 9:10 AM" },
  },
];

/**
 * Retrieval-only by design (matches the real app's D18/D19 invariant): every assistant reply here
 * carries a citation back to who said it and when — this prototype doesn't call a real model, but the
 * UI pattern (answer always paired with its verbatim source) is the thing being designed, not faked
 * away. No answer without a citation, in this mock data or the real one.
 */
export function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = `m${messages.length + 1}`;
    setMessages((prev) => [...prev, { id, kind: "patient", text: trimmed }]);
    setDraft("");
    // Illustrative canned reply — a design prototype, not a live model.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${id}-a`,
          kind: "assistant",
          text: "I can only answer from what was actually said at your bedside — let me check what's on record for that.",
          citation: { speaker: "Nurse Ade", when: "Today, 11:40 AM" },
        },
      ]);
    }, 500);
  }

  return (
    <div className="screen" style={{ paddingBottom: "calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 88px)" }}>
      <div className="section" style={{ marginBottom: "var(--space-md)" }}>
        <BackLink to="/history" label="Back to History" />
      </div>

      <div className="section">
        <h1 className="h1">Chat about your care</h1>
        <p className="body">Ask a question — answers only ever come from what was actually said.</p>
      </div>

      <div className="section">
        <div className="suggestrow">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="suggestchip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        {messages.map((m) =>
          m.kind === "patient" ? (
            <div key={m.id} className="bubble-row bubble-row--patient">
              <div className="bubble bubble--patient">
                <p>{m.text}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="bubble-row">
              <div>
                <div className="bubble bubble--assistant">
                  <p>{m.text}</p>
                </div>
                <Link className="citation" to="/medicines">
                  <span>
                    Said by {m.citation.speaker} · {m.citation.when}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="section">
        <h2 className="h2">Also worth asking your doctor</h2>
        <div className="card">
          <Link className="qcard" to="/medicines">
            <span className="qcard__icon" aria-hidden="true"><QuestionIcon size={20} /></span>
            <p className="body">Which aspirin dose is current for me — 75 milligrams or 150 milligrams?</p>
          </Link>
        </div>
      </div>

      <form
        className="chatbar"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          type="text"
          placeholder="Ask a question…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Ask a question"
        />
        <button type="submit" aria-label="Send" disabled={!draft.trim()}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
