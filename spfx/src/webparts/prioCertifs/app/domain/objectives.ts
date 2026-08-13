import type { Certification, CertPrioritizationState } from "./types";

/* ============ objectifs : donnees sources vs decisions COMEX ============
   Sources (lecture seule, jamais modifiables depuis l'interface) :
     objective.obtenu  - nb de certifies actuels
     objective.enCours - nb de personnes en cours de certification (aucune
                         source ne l'alimente encore : reste "Non renseigne"
                         tant qu'un fichier/flux ne le fournit pas)
     objective.quota   - objectif global (nb total de certifications
                         disponibles), jamais affecte par l'objectif fixe
   Decision COMEX (editable, persistee dans state.certTargets) :
     l'objectif fixe pour une certification. Modele tri-etat : absent ->
     herite du quota source ; nombre -> override explicite ; null -> "pas
     d'objectif" force explicitement, meme si une valeur source existe. */

export function getSourceObtenu(cert: Certification): number | null {
  const v = cert.objective.obtenu;
  return v === null || v === undefined ? null : v;
}

export function getSourceEnCours(cert: Certification): number | null {
  const v = cert.objective.enCours;
  return v === null || v === undefined ? null : v;
}

export function getBaseTarget(cert: Certification): number | null {
  const v = cert.objective.quota;
  return v === null || v === undefined ? null : v;
}

export function isTargetOverridden(state: CertPrioritizationState, cert: Certification): boolean {
  return Object.prototype.hasOwnProperty.call(state.certTargets, cert.id);
}

export function getEffectiveTarget(state: CertPrioritizationState, cert: Certification): number | null {
  if (isTargetOverridden(state, cert)) return state.certTargets[cert.id];
  return getBaseTarget(cert);
}
