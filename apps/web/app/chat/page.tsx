"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AskResponse, GeneratedQuestion } from "@medthread/domain";
import { SendIcon } from "../../components/icons";
import { ask, generateQuestions } from "../../lib/api";
import { askResponses, entryId, formatDate, generatedQuestionsFallback, getClaim, patientName } from "../../lib/data";
import { usePicture } from "../../lib/store";

// Ask (LIVE). Questions POST to /api/ask, which only ever answers from what clinicians actually said:
// a grounded plain-language answer + server-derived citations, or `no_source` (D18/D19 — never a guess).
// "What should I ask my doctor?" fetches grounded questions from /api/questions. Both fall back to
// clearly-labelled sample answers when the server can't be reached.

type Message =
  | { id: string; role: "me"; text: string }
  | { id: string; role: "app"; kind: "text"; text: string }
  | { id: string; role: "app"; kind: "answer"; response: AskResponse; offline: boolean }
  | { id: string; role: "app"; kind: "questions" };

const SUGGESTIONS = ["What medicines should I take?", "When are my appointments?"] as const;
const DOCTOR = "What should I ask my doctor?";
const FALLBACK_ORDER = ["answered", "partial", "no_source"] as const;

export default function Chat() {
  const { picture } = usePicture();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "hello",
      role: "app",
      kind: "text",
      text: `Hello ${patientName}. Ask me about anything you were told: your medicines, appointments or results. I only repeat what your care team actually said, and I'll show you who said it.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQuestion[] | null>(null);
  const [genPending, setGenPending] = useState(false);
  const idRef = useRef(0);
  const fbRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const nextId = () => `m${idRef.current++}`;
  const add = (...m: Message[]) => setMessages((prev) => [...prev, ...m]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, genPending, generated]);

  function fallback(): AskResponse {
    const kind = FALLBACK_ORDER[fbRef.current % FALLBACK_ORDER.length]!;
    fbRef.current += 1;
    return askResponses[kind];
  }

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || pending) return;
    add({ id: nextId(), role: "me", text: question });
    setInput("");
    setPending(true);
    try {
      add({ id: nextId(), role: "app", kind: "answer", response: await ask(question, picture.groups), offline: false });
    } catch {
      add({ id: nextId(), role: "app", kind: "answer", response: fallback(), offline: true });
    } finally {
      setPending(false);
    }
  }

  async function askDoctorQuestions() {
    add({ id: nextId(), role: "me", text: DOCTOR }, { id: nextId(), role: "app", kind: "questions" });
    if (generated !== null || genPending) return;
    setGenPending(true);
    try {
      setGenerated(await generateQuestions(picture.groups));
    } catch {
      setGenerated(generatedQuestionsFallback);
    } finally {
      setGenPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const topicHref = (claimId: string) => {
    const c = getClaim(claimId, picture.claims);
    return c ? `/topic/${entryId(c.category, c.subject)}` : null;
  };

  return (
    <main className="chat">
      <header className="topbar">
        <h1 className="topbar__title">Ask about your care</h1>
      </header>

      <div className="chat__thread" aria-live="polite">
        {messages.map((m) => {
          if (m.role === "me") {
            return (
              <div key={m.id} className="msg msg--me">
                <p className="t-body">{m.text}</p>
              </div>
            );
          }
          if (m.kind === "text") {
            return (
              <div key={m.id} className="msg msg--app">
                <p className="t-body">{m.text}</p>
              </div>
            );
          }
          if (m.kind === "questions") {
            return (
              <div key={m.id} className="msg msg--app">
                <p className="t-body strong">
                  You could ask:
                </p>
                <ul className="qlist">
                  {(generated ?? []).map((q) => {
                    const href = q.fromClaimIds[0] ? topicHref(q.fromClaimIds[0]) : null;
                    return (
                      <li key={q.id} className="qitem">
                        <p className="t-body">{q.prompt}</p>
                        {href ? (
                          <Link className="link t-small" href={href}>
                            See what was said
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                  {picture.questions.map((q) => (
                    <li key={q.id} className="qitem">
                      <p className="t-body">{q.prompt}</p>
                      <Link className="link t-small" href="/questions">
                        See who said what
                      </Link>
                    </li>
                  ))}
                </ul>
                {genPending ? <p className="t-small muted">Thinking of a few more…</p> : null}
                {!genPending && (generated ?? []).length === 0 && picture.questions.length === 0 ? (
                  <p className="t-body">Nothing stands out to ask about right now.</p>
                ) : null}
              </div>
            );
          }
          const r = m.response;
          return (
            <div key={m.id} className="msg msg--app">
              {m.offline ? <span className="pill pill--plain">Sample answer. The server couldn&apos;t be reached.</span> : null}
              {r.kind === "no_source" ? (
                <>
                  <p className="t-body">Nobody has told you this yet, so I won&apos;t guess.</p>
                  <p className="t-body">You could ask: {r.suggestedQuestion}</p>
                </>
              ) : (
                <>
                  <p className="t-body">{r.answerText}</p>
                  {r.kind === "partial" ? <p className="t-body muted">Still worth checking: {r.gap}</p> : null}
                  <div className="cite">
                    <span className="t-small muted">Who said this</span>
                    {r.citations.map((c) => {
                      const href = topicHref(c.claimId);
                      const label = `${c.speaker}, ${formatDate(c.observedAt)}`;
                      return href ? (
                        <Link key={c.claimId} className="link t-small" href={href}>
                          {label}
                        </Link>
                      ) : (
                        <span key={c.claimId} className="t-small">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
        {pending ? (
          <div className="msg msg--app">
            <p className="t-body muted">Looking through what you&apos;ve been told…</p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={onSubmit}>
        {!pending ? (
          <div className="composer__suggest" role="group" aria-label="Suggested questions">
            <button type="button" className="chip" onClick={() => void askDoctorQuestions()}>
              {DOCTOR}
            </button>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => void send(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
        <div className="composer__row">
          <label className="sr-only" htmlFor="ask-input">
            Your question
          </label>
          <textarea
            id="ask-input"
            className="composer__input"
            rows={1}
            placeholder="Type a question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <button type="submit" className="btn btn--primary composer__send" disabled={pending || !input.trim()}>
            <SendIcon />
            Ask
          </button>
        </div>
      </form>
    </main>
  );
}
