import type { Certification, CertPrioritizationState, CertStatus } from "./types";
import { getEffectiveTarget, getSourceEnCours, getSourceObtenu } from "./objectives";
import { getEffectivePriority } from "./priority";

export function getProjection(cert: Certification): number | null {
  const o = getSourceObtenu(cert);
  const e = getSourceEnCours(cert);
  return o !== null && e !== null ? o + e : null;
}

export function getGap(state: CertPrioritizationState, cert: Certification): number | null {
  const t = getEffectiveTarget(state, cert);
  const o = getSourceObtenu(cert);
  return t !== null && o !== null ? Math.max(t - o, 0) : null;
}

export function getResteAEngager(state: CertPrioritizationState, cert: Certification): number | null {
  const t = getEffectiveTarget(state, cert);
  const p = getProjection(cert);
  return t !== null && p !== null ? Math.max(t - p, 0) : null;
}

export const STATUS_META: Record<CertStatus, { label: string; color: string | null }> = {
  atteint: { label: "Objectif atteint", color: "var(--good)" },
  bonneVoie: { label: "En bonne voie", color: "var(--accent)" },
  accelerer: { label: "À accélérer", color: "var(--serious)" },
  na: { label: "Non renseigné", color: null },
};

export function getCertStatus(state: CertPrioritizationState, cert: Certification): CertStatus {
  const t = getEffectiveTarget(state, cert);
  const p = getProjection(cert);
  if (t === null || p === null) return "na";
  if (Math.max(t - p, 0) <= 0) return "atteint";
  const ratio = t > 0 ? p / t : 0;
  if (ratio >= 0.6) return "bonneVoie";
  if (getEffectivePriority(state, cert) >= 7) return "accelerer";
  return "bonneVoie";
}

export function fmtSortVal(n: number | null | undefined): number {
  return n === null || n === undefined ? -1 : n;
}
