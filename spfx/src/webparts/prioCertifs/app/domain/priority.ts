import type { Certification, CertPrioritizationState } from "./types";
import { getBaseTarget, getEffectiveTarget } from "./objectives";

export const DEFAULT_PRIORITY = 5;

export function getProviderPriority(state: CertPrioritizationState, provider: string): number {
  const v = state.providerPriorities[provider];
  return v === undefined || v === null ? DEFAULT_PRIORITY : v;
}

export function isProviderTouched(state: CertPrioritizationState, provider: string): boolean {
  return state.providerPriorities[provider] !== undefined;
}

export function getCertOverride(state: CertPrioritizationState, certId: string): number | null {
  const v = state.certOverrides[certId];
  return v === undefined || v === null ? null : v;
}

/* Suggestion automatique (uniquement tant qu'aucune decision manuelle
   n'existe ni sur la certification ni sur le fournisseur) : plus l'objectif
   fixe par le COMEX est ambitieux par rapport a l'objectif global (quota
   source, capacite totale disponible pour cette certification), plus on
   pousse. Ne s'applique que si un objectif global ET un objectif fixe sont
   connus, sinon on retombe sur DEFAULT_PRIORITY. */
export function getSuggestedPriority(state: CertPrioritizationState, cert: Certification): number | null {
  const quota = getBaseTarget(cert);
  const target = getEffectiveTarget(state, cert);
  if (quota === null || quota <= 0 || target === null) return null;
  const ratio = target / quota;
  if (ratio > 0.9) return 10;
  if (ratio > 0.75) return 9;
  if (ratio > 0.55) return 8;
  if (ratio >= 0.4) return 7;
  if (ratio >= 0.2) return 6;
  return null; // < 20% : pas de suggestion, reste au defaut (5)
}

export function isPrioritySuggested(state: CertPrioritizationState, cert: Certification): boolean {
  return (
    getCertOverride(state, cert.id) === null &&
    !isProviderTouched(state, cert.provider) &&
    getSuggestedPriority(state, cert) !== null
  );
}

/** Cascade : override cert > priorite provider (si touche) > suggestion automatique > defaut. */
export function getEffectivePriority(state: CertPrioritizationState, cert: Certification): number {
  const ov = getCertOverride(state, cert.id);
  if (ov !== null) return ov;
  if (isProviderTouched(state, cert.provider)) return getProviderPriority(state, cert.provider);
  const suggested = getSuggestedPriority(state, cert);
  return suggested !== null ? suggested : DEFAULT_PRIORITY;
}
