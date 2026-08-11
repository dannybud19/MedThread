import { useState } from "react";
import { CheckIcon } from "../icons";

/**
 * One dose slot's row of selectable time options. Each row manages its own selection independently
 * — picking a morning time never touches the evening row.
 *
 * NATIVE-PORT NOTE: this whole component stands in for what becomes a native time picker
 * (UIDatePicker / Android TimePicker) later. Self-contained (props in, selection out via onChange)
 * so swapping it for a native control is a clean cut — nothing else depends on its internals.
 */
export function ChipRow({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: string[];
  defaultValue: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="chiprow" role="group" aria-label={label}>
      {options.map((time) => {
        const pressed = time === selected;
        return (
          <button
            key={time}
            type="button"
            className="chip"
            aria-pressed={pressed}
            onClick={() => setSelected(time)}
          >
            {/* Selected state is colour fill + a real checkmark element (never a CSS pseudo-element
                — no native-port equivalent for pseudo-element content), same rule as MoodRow. */}
            <span className="chip__check" aria-hidden="true">
              <CheckIcon size={14} strokeWidth={4} />
            </span>
            {time}
          </button>
        );
      })}
    </div>
  );
}
