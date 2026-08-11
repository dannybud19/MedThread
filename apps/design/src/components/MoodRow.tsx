import { useState } from "react";
import { CheckIcon } from "../icons";

/** Simple outlined faces, never emoji — each mouth curve is the only thing that differs. */
const MOODS = [
  { id: "good", label: "Good", mouth: "M7.5 14.5c1 1.5 3 2 4.5 2s3.5-.5 4.5-2" },
  { id: "okay", label: "Okay", mouth: "M8 15c1 .7 2.5 1 4 1s3-.3 4-1" },
  { id: "neutral", label: "Neutral", mouth: "M8.5 15h7" },
  { id: "low", label: "Low", mouth: "M8 16c1-.7 2.5-1 4-1s3 .3 4 1" },
  { id: "poor", label: "Poor", mouth: "M7.5 16.5c1-1.5 3-2 4.5-2s3.5.5 4.5 2" },
] as const;

/** "How are you feeling today?" — 5 mood options, unmistakable selected state: colour fill + a
 * checkmark badge, never a subtle border change alone (LAYOUT section). */
export function MoodRow() {
  const [selected, setSelected] = useState<string>("good");
  return (
    <div className="moodrow" role="group" aria-label="How are you feeling today?">
      {MOODS.map((m) => {
        const pressed = m.id === selected;
        return (
          <button
            key={m.id}
            type="button"
            className="mood"
            aria-pressed={pressed}
            onClick={() => setSelected(m.id)}
          >
            <span className="mood__face" aria-hidden="true">
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
                <path d={m.mouth} />
              </svg>
              <span className="mood__check" aria-hidden="true">
                <CheckIcon size={12} strokeWidth={4} />
              </span>
            </span>
            <span className="mood__label">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
