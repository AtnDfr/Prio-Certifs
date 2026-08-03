import { emptyState, type CertPrioritizationState } from "../domain/types";

/**
 * localStorage, memes cles que le prototype HTML. A traiter explicitement
 * comme un stockage de DEVELOPPEMENT LOCAL uniquement (contrainte de la note
 * de cadrage) : la source de verite finale sera une source gouvernee
 * (SharePoint / Easy Training), pas ce module.
 */
const STORAGE_KEY = "prioCertifsWavestone_v1";

export function loadStoredState(): CertPrioritizationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      providerPriorities: parsed.providerPriorities || {},
      certOverrides: parsed.certOverrides || {},
      certTargets: parsed.certTargets || {},
    };
  } catch {
    return emptyState();
  }
}

export function saveStoredState(state: CertPrioritizationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
