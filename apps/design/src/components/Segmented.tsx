/** Hospital stay / Recovery — a state of "what today looks like", not a navigation axis (Stage 1). */
export function Segmented({
  value,
  onChange,
}: {
  value: "admitted" | "recovery";
  onChange: (v: "admitted" | "recovery") => void;
}) {
  return (
    <div className="segmented" role="group" aria-label="Admission phase">
      <button type="button" aria-pressed={value === "admitted"} onClick={() => onChange("admitted")}>
        Hospital stay
      </button>
      <button type="button" aria-pressed={value === "recovery"} onClick={() => onChange("recovery")}>
        Recovery
      </button>
    </div>
  );
}
