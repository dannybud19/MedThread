"use client";

import Link from "next/link";

/**
 * Once discharged, the patient can move between their hospital stay and their recovery at home.
 * Rendered only when discharged, on both ends.
 */
export function PhaseSwitch({ current }: { current: "stay" | "recovery" }) {
  return (
    <nav className="segmented" aria-label="Which part of your care">
      <Link href="/" className="segmented__item" aria-current={current === "stay" ? "page" : undefined}>
        Hospital stay
      </Link>
      <Link href="/recovery" className="segmented__item" aria-current={current === "recovery" ? "page" : undefined}>
        At home
      </Link>
    </nav>
  );
}
