import { useState } from "react";
import { ChevronDownIcon, InfoIcon } from "../icons";

/** Expandable alert (e.g. "This seems worth asking about") — calm, never alarming. */
export function Alert({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="alert">
      <button type="button" className="alert__header" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <InfoIcon size={24} strokeWidth={2} />
        <span className="alert__title">
          {title}
          <br />
          <span className="alert__sub">{sub}</span>
        </span>
        <span style={{ transform: open ? "rotate(180deg)" : undefined, display: "inline-flex" }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open ? <div className="alert__body">{children}</div> : null}
    </div>
  );
}
