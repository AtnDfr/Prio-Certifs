import * as React from "react";
import { useState } from "react";

type Props = {
  value: number | null;
  overridden: boolean;
  onCommit: (value: number | null) => void;
};

/**
 * Champ "Objectif fixé", editable en ligne dans les tableaux Certifications
 * et Providers. Commit au blur ou sur Entree (pas a chaque frappe), comme
 * dans le prototype HTML. Utiliser une `key` differente au niveau de
 * l'appelant (ex: `${cert.id}:${value}`) si la valeur peut changer pour une
 * raison externe (reset global) pendant que ce champ est monte.
 */
export function TargetInlineInput({ value, overridden, onCommit }: Props) {
  const [draft, setDraft] = useState(value !== null ? String(value) : "");

  function commit() {
    const raw = draft.trim();
    const newVal = raw === "" ? null : Math.max(0, Math.round(Number(raw)) || 0);
    if (newVal !== value) onCommit(newVal);
  }

  return (
    <>
      <input
        type="number"
        min={0}
        step={1}
        className="target-inline-input"
        placeholder="Non défini"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {overridden && <span className="override-badge">ajusté</span>}
    </>
  );
}
