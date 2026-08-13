import * as React from "react";
import { seqColor, seqTextColor } from "../../ui/colors";

type Props = {
  value: number;
  onChange: (n: number) => void;
  readonly?: boolean;
};

export function PriorityPicker({ value, onChange, readonly = false }: Props) {
  return (
    <div className={"priority-picker" + (readonly ? " readonly" : "")}>
      {Array.from({ length: 11 }, (_, n) => n).map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            data-n={n}
            className={"priority-dot" + (active ? " active" : "")}
            disabled={readonly}
            style={active ? { background: seqColor(n), color: seqTextColor(n) } : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
