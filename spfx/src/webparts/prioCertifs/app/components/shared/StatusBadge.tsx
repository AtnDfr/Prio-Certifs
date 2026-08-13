import * as React from "react";
import type { Certification, CertPrioritizationState } from "../../domain/types";
import { getCertStatus, STATUS_META } from "../../domain/derived";

export function StatusBadge({ state, cert }: { state: CertPrioritizationState; cert: Certification }) {
  const key = getCertStatus(state, cert);
  const meta = STATUS_META[key];
  if (key === "na") return <span className="status-badge status-na">{meta.label}</span>;
  return (
    <span className="status-badge" style={{ background: meta.color ?? undefined }}>
      {meta.label}
    </span>
  );
}
