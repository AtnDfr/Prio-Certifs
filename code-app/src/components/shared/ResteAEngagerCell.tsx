import type { Certification, CertPrioritizationState } from "../../domain/types";
import { getResteAEngager } from "../../domain/derived";

export function ResteAEngagerCell({ state, cert }: { state: CertPrioritizationState; cert: Certification }) {
  const v = getResteAEngager(state, cert);
  if (v === null) return <span className="na">Non renseigné</span>;
  if (v <= 0) return <span style={{ color: "var(--good)", fontWeight: 700 }}>Atteint</span>;
  return <span style={{ fontWeight: 700 }}>{v}</span>;
}
